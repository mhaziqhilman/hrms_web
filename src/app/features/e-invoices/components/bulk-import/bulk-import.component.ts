import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';

import { EInvoiceService } from '../../services/e-invoice.service';
import { BulkImportResult, ExtractionProvider, BulkExtractItem, ExtractedInvoiceData } from '../../models/invoice.model';
import { ProjectService } from '@/features/projects/services/project.service';
import { Project } from '@/features/projects/models/project.model';
import { InvoiceReviewSheetComponent } from '../invoice-review-sheet/invoice-review-sheet.component';

const EXTRACTION_PROVIDER_KEY = 'einvoice.extractionProvider';

interface EditableItem extends BulkExtractItem {
  skip: boolean;
  project_id: number | null;
  expanded: boolean;
  reviewed: boolean;
}

type Stage = 'idle' | 'extracting' | 'review' | 'creating' | 'done';

@Component({
  selector: 'app-bulk-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardButtonComponent,
    ZardIconComponent,
    ZardTooltipModule,
    ZardBadgeComponent,
    InvoiceReviewSheetComponent
  ],
  templateUrl: './bulk-import.component.html',
  styleUrls: ['./bulk-import.component.css']
})
export class BulkImportComponent {
  private invoiceService = inject(EInvoiceService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  stage = signal<Stage>('idle');
  files = signal<File[]>([]);
  dragging = signal(false);
  asRecorded = true;
  selectedProvider = signal<ExtractionProvider>(
    (localStorage.getItem(EXTRACTION_PROVIDER_KEY) as ExtractionProvider) || 'anthropic'
  );

  items = signal<EditableItem[]>([]);
  result = signal<BulkImportResult | null>(null);
  projects = signal<Project[]>([]);

  // Review sheet
  reviewSheetOpen = signal(false);
  reviewItem = signal<BulkExtractItem | null>(null);
  reviewIndex = signal<number | null>(null);

  readonly MAX_FILES = 20;
  readonly MAX_SIZE_MB = 10;

  // ─── View helpers (summary rail) ───────────────
  // Current step in the 3-step flow, derived from stage(). View-only.
  currentStep = computed<number>(() => {
    const s = this.stage();
    if (s === 'idle' || s === 'extracting') return 1;
    if (s === 'review') return 2;
    return 3; // creating | done
  });

  providerLabel = computed<string>(() =>
    this.selectedProvider() === 'anthropic' ? 'Claude' : 'Qwen'
  );

  // Total value of the invoices that will actually be created.
  grandTotal = computed<number>(() =>
    this.items()
      .filter(it => !it.skip && it.extracted)
      .reduce((sum, it) => sum + this.itemTotal(it), 0)
  );

  constructor() {
    this.projectService.list({ limit: 200 }).subscribe({
      next: res => this.projects.set(res.data.projects),
      error: () => {}
    });
  }

  onProviderChange(value: ExtractionProvider) {
    this.selectedProvider.set(value);
    localStorage.setItem(EXTRACTION_PROVIDER_KEY, value);
  }

  // ─── Stage 1: file picker ──────────────────────

  onFilesPicked(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragging.set(true); }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.dragging.set(false); }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    if (e.dataTransfer?.files) this.addFiles(Array.from(e.dataTransfer.files));
  }

  private addFiles(incoming: File[]) {
    const valid = incoming.filter(f => f.type === 'application/pdf' && f.size <= this.MAX_SIZE_MB * 1024 * 1024);
    this.files.set([...this.files(), ...valid].slice(0, this.MAX_FILES));
  }

  removeFile(i: number) {
    const next = [...this.files()];
    next.splice(i, 1);
    this.files.set(next);
  }

  clearAll() {
    this.files.set([]);
    this.items.set([]);
    this.result.set(null);
    this.stage.set('idle');
  }

  // ─── Stage 2: extraction ───────────────────────

  startExtract() {
    const queued = this.files();
    if (queued.length === 0) return;
    this.stage.set('extracting');

    this.invoiceService.bulkExtract(queued, this.selectedProvider()).subscribe({
      next: (res) => {
        if (!res.success) {
          this.stage.set('idle');
          return;
        }
        const editable: EditableItem[] = res.data.results.map(r => {
          // Primary project for the row — prefer the single-project match, else
          // first matched project in multi-PO case. Backend will resolve per-line
          // project_id from po_number on each item separately.
          const primary = r.po_match?.project
            || r.po_match?.matches?.find(m => m.project)?.project
            || null;
          return {
            ...r,
            skip: !!r.error || !r.extracted,
            project_id: primary?.id ?? null,
            expanded: false,
            reviewed: false
          };
        });
        this.items.set(editable);
        this.stage.set('review');
      },
      error: (err) => {
        this.stage.set('idle');
        alert(err?.error?.message || 'Bulk extraction failed');
      }
    });
  }

  // ─── Stage 3: review ───────────────────────────

  toggleExpand(i: number) {
    const list = [...this.items()];
    list[i] = { ...list[i], expanded: !list[i].expanded };
    this.items.set(list);
  }

  toggleSkip(i: number) {
    const list = [...this.items()];
    list[i] = { ...list[i], skip: !list[i].skip };
    this.items.set(list);
  }

  openReview(i: number) {
    const item = this.items()[i];
    if (!item.extracted) return;
    this.reviewItem.set(item);
    this.reviewIndex.set(i);
    this.reviewSheetOpen.set(true);
  }

  onReviewClosed(open: boolean) {
    this.reviewSheetOpen.set(open);
    if (!open) {
      this.reviewItem.set(null);
      this.reviewIndex.set(null);
    }
  }

  onReviewSaved(payload: { extracted: ExtractedInvoiceData; project_id: number | null; filename: string }) {
    const idx = this.reviewIndex();
    if (idx === null) return;
    const list = [...this.items()];
    list[idx] = {
      ...list[idx],
      extracted: payload.extracted,
      project_id: payload.project_id,
      reviewed: true
    };
    this.items.set(list);
  }

  countActive(): number {
    return this.items().filter(it => !it.skip && it.extracted).length;
  }

  countErrors(): number {
    return this.items().filter(it => it.error).length;
  }

  // ─── Stage 4: create ───────────────────────────

  confirmCreate() {
    const payload = this.items()
      .filter(it => !it.skip && it.extracted)
      .map(it => ({
        filename: it.filename,
        extracted: it.extracted!,
        project_id: it.project_id
      }));

    if (payload.length === 0) {
      alert('Nothing to create — all items are skipped.');
      return;
    }

    this.stage.set('creating');
    this.invoiceService.bulkCreate(payload, this.asRecorded).subscribe({
      next: (res) => {
        if (res.success) {
          this.result.set(res.data);
          this.stage.set('done');
        } else {
          this.stage.set('review');
        }
      },
      error: (err) => {
        this.stage.set('review');
        alert(err?.error?.message || 'Bulk create failed');
      }
    });
  }

  goToInvoice(publicId: string) {
    this.router.navigate(['/e-invoices', publicId]);
  }

  startOver() {
    this.clearAll();
  }

  // ─── Helpers ───────────────────────────────────

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatCurrency(amount: number | string): string {
    return parseFloat(String(amount || 0)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  itemTotal(item: EditableItem): number {
    if (!item.extracted?.items) return 0;
    return item.extracted.items.reduce((sum, li) => {
      const sub = (Number(li.quantity) || 0) * (Number(li.unit_price) || 0) - (Number(li.discount_amount) || 0);
      return sum + sub + sub * (Number(li.tax_rate) || 0) / 100;
    }, 0);
  }

  confidenceBadge(confidence?: string): 'default' | 'secondary' | 'destructive' {
    if (confidence === 'high') return 'default';
    if (confidence === 'medium') return 'secondary';
    return 'destructive';
  }
}
