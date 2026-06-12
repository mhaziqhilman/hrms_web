import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ZardSheetImports } from '@/shared/components/sheet/sheet.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardFormControlComponent } from '@/shared/components/form/form-control.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { BulkExtractItem, ExtractedInvoiceData, TaxType } from '../../models/invoice.model';
import { Project } from '@/features/projects/models/project.model';

interface ReviewLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_type: TaxType;
  tax_rate: number;
  unit_of_measurement: string;
  classification_code: string;
  po_number: string;
}

@Component({
  selector: 'app-invoice-review-sheet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ZardSheetImports,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardDividerComponent,
    ZardInputDirective,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardFormControlComponent,
    ZardDatePickerComponent
  ],
  templateUrl: './invoice-review-sheet.component.html',
  styleUrls: ['./invoice-review-sheet.component.css']
})
export class InvoiceReviewSheetComponent implements OnChanges {
  @Input() open = false;
  @Input() item: BulkExtractItem | null = null;
  @Input() projects: Project[] = [];
  @Output() openChange = new EventEmitter<boolean>();
  @Output() itemSaved = new EventEmitter<{ extracted: ExtractedInvoiceData; project_id: number | null; filename: string }>();

  private fb = inject(FormBuilder);

  detailsForm: FormGroup = this.fb.group({
    invoice_number: [''],
    po_number: [''],
    title: [''],
    invoice_type: ['01'],
    currency: ['MYR'],
    invoice_date: [new Date()],
    due_date: [null],
    commence_date_start: [null],
    commence_date_end: [null],
    payment_terms: [''],
    is_self_billed: [false],
    notes: ['']
  });

  supplierForm: FormGroup = this.fb.group({
    supplier_name: [''],
    supplier_tin: [''],
    supplier_brn: [''],
    supplier_sst_no: [''],
    supplier_msic_code: [''],
    supplier_address: [''],
    supplier_phone: [''],
    supplier_email: ['']
  });

  buyerForm: FormGroup = this.fb.group({
    buyer_name: [''],
    buyer_tin: [''],
    buyer_brn: [''],
    buyer_address: [''],
    buyer_phone: [''],
    buyer_email: ['']
  });

  items: ReviewLineItem[] = [];
  selectedProjectId = signal<number | null>(null);

  readonly INVOICE_TYPES = [
    { value: '01', label: 'Invoice' },
    { value: '02', label: 'Credit Note' },
    { value: '03', label: 'Debit Note' },
    { value: '04', label: 'Refund Note' }
  ];
  readonly CURRENCIES = ['MYR', 'USD', 'SGD', 'EUR'];
  readonly TAX_TYPES: TaxType[] = ['SST', 'Service Tax', 'Exempt', 'Zero Rated'];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['item'] && this.item?.extracted) {
      this.populateFromExtracted(this.item.extracted);
      // Auto-pre-select the primary project from the PO matches:
      //  • Single-PO clean match → that project
      //  • Multi-PO → first matched project (user can override via dropdown)
      //  • Backend resolves per-line project_id from po_number regardless.
      const pm = this.item.po_match;
      const primary = pm?.project
        || pm?.matches?.find(m => m.project)?.project
        || null;
      this.selectedProjectId.set(primary?.id ?? null);
    }
  }

  private populateFromExtracted(e: ExtractedInvoiceData) {
    this.detailsForm.patchValue({
      invoice_number: e.invoice_number || '',
      po_number: e.po_number || '',
      title: e.title || '',
      invoice_type: e.invoice_type || '01',
      currency: e.currency || 'MYR',
      invoice_date: e.invoice_date ? new Date(e.invoice_date) : new Date(),
      due_date: e.due_date ? new Date(e.due_date) : null,
      commence_date_start: e.commence_date_start ? new Date(e.commence_date_start) : null,
      commence_date_end: e.commence_date_end ? new Date(e.commence_date_end) : null,
      payment_terms: e.payment_terms || '',
      is_self_billed: !!e.is_self_billed,
      notes: e.notes || ''
    });

    this.supplierForm.patchValue({
      supplier_name: e.supplier_name || '',
      supplier_tin: e.supplier_tin || '',
      supplier_brn: e.supplier_brn || '',
      supplier_sst_no: e.supplier_sst_no || '',
      supplier_msic_code: e.supplier_msic_code || '',
      supplier_address: e.supplier_address || '',
      supplier_phone: e.supplier_phone || '',
      supplier_email: e.supplier_email || ''
    });

    this.buyerForm.patchValue({
      buyer_name: e.buyer_name || '',
      buyer_tin: e.buyer_tin || '',
      buyer_brn: e.buyer_brn || '',
      buyer_address: e.buyer_address || '',
      buyer_phone: e.buyer_phone || '',
      buyer_email: e.buyer_email || ''
    });

    this.items = (e.items || []).map(it => ({
      description: it.description || '',
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unit_price) || 0,
      discount_amount: Number(it.discount_amount) || 0,
      tax_type: (it.tax_type || 'Exempt') as TaxType,
      tax_rate: Number(it.tax_rate) || 0,
      unit_of_measurement: it.unit_of_measurement || 'EA',
      classification_code: it.classification_code || '',
      po_number: it.po_number || ''
    }));

    if (this.items.length === 0) this.addItem();
  }

  addItem() {
    this.items.push({
      description: '', quantity: 1, unit_price: 0, discount_amount: 0,
      tax_type: 'Exempt', tax_rate: 0, unit_of_measurement: 'EA', classification_code: '',
      po_number: ''
    });
  }

  removeItem(i: number) {
    if (this.items.length > 1) this.items.splice(i, 1);
  }

  lineTotal(it: ReviewLineItem): number {
    const sub = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) - (Number(it.discount_amount) || 0);
    return sub + sub * (Number(it.tax_rate) || 0) / 100;
  }

  get grandTotal(): number {
    return this.items.reduce((sum, it) => sum + this.lineTotal(it), 0);
  }

  onProjectChange(id: number | null) {
    this.selectedProjectId.set(id);
  }

  // Live lookup so each line item shows which project its PO maps to.
  // Returns the matching project or null. Falls back to PO-match entries
  // returned by the backend if the project isn't in the visible projects list.
  lookupProjectByPo(po: string): { code: string; name: string } | null {
    if (!po) return null;
    const trimmed = po.trim();
    const fromList = this.projects.find(p => (p.po_number || '').trim() === trimmed);
    if (fromList) return { code: fromList.code, name: fromList.name };
    const fromMatch = this.item?.po_match?.matches?.find(m => m.po_number === trimmed && m.project);
    return fromMatch?.project ? { code: fromMatch.project.code, name: fromMatch.project.name } : null;
  }

  /**
   * Aggregate every project this invoice will be linked to — primary one from
   * the dropdown, plus every distinct project derived from line-item POs.
   */
  getLinkedProjects(): { id: number; code: string; name: string; po_number: string | null }[] {
    const map = new Map<number, { id: number; code: string; name: string; po_number: string | null }>();
    const primaryId = this.selectedProjectId();
    if (primaryId) {
      const primary = this.projects.find(p => p.id === primaryId);
      if (primary) {
        map.set(primary.id, { id: primary.id, code: primary.code, name: primary.name, po_number: primary.po_number || null });
      }
    }
    for (const it of this.items) {
      const po = (it.po_number || '').trim();
      if (!po) continue;
      const fromList = this.projects.find(p => (p.po_number || '').trim() === po);
      if (fromList && !map.has(fromList.id)) {
        map.set(fromList.id, { id: fromList.id, code: fromList.code, name: fromList.name, po_number: fromList.po_number || null });
        continue;
      }
      // Fall back to PO match entries from backend (covers projects beyond the visible list)
      const fromMatch = this.item?.po_match?.matches?.find(m => m.po_number === po && m.project);
      if (fromMatch?.project && !map.has(fromMatch.project.id)) {
        map.set(fromMatch.project.id, {
          id: fromMatch.project.id,
          code: fromMatch.project.code,
          name: fromMatch.project.name,
          po_number: fromMatch.project.po_number
        });
      }
    }
    return Array.from(map.values());
  }

  private formatDate(d: Date | null): string | undefined {
    if (!d) return undefined;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return undefined;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  saveChanges() {
    if (!this.item) return;
    const d = this.detailsForm.value;
    const s = this.supplierForm.value;
    const b = this.buyerForm.value;

    const updated: ExtractedInvoiceData = {
      invoice_number: d.invoice_number || undefined,
      po_number: d.po_number || undefined,
      title: d.title || undefined,
      invoice_type: d.invoice_type,
      currency: d.currency,
      invoice_date: this.formatDate(d.invoice_date) || new Date().toISOString().slice(0, 10),
      due_date: this.formatDate(d.due_date),
      commence_date_start: this.formatDate(d.commence_date_start),
      commence_date_end: this.formatDate(d.commence_date_end),
      payment_terms: d.payment_terms || undefined,
      is_self_billed: !!d.is_self_billed,
      notes: d.notes || undefined,
      supplier_name: s.supplier_name || '',
      supplier_tin: s.supplier_tin || undefined,
      supplier_brn: s.supplier_brn || undefined,
      supplier_sst_no: s.supplier_sst_no || undefined,
      supplier_msic_code: s.supplier_msic_code || undefined,
      supplier_address: s.supplier_address || undefined,
      supplier_phone: s.supplier_phone || undefined,
      supplier_email: s.supplier_email || undefined,
      buyer_name: b.buyer_name || '',
      buyer_tin: b.buyer_tin || undefined,
      buyer_brn: b.buyer_brn || undefined,
      buyer_address: b.buyer_address || undefined,
      buyer_phone: b.buyer_phone || undefined,
      buyer_email: b.buyer_email || undefined,
      items: this.items.map(it => ({
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        discount_amount: it.discount_amount,
        tax_type: it.tax_type,
        tax_rate: it.tax_rate,
        unit_of_measurement: it.unit_of_measurement,
        classification_code: it.classification_code || undefined,
        po_number: it.po_number || undefined
      })),
      confidence: this.item.extracted?.confidence || 'medium',
      extraction_notes: this.item.extracted?.extraction_notes
    };

    this.itemSaved.emit({
      extracted: updated,
      project_id: this.selectedProjectId(),
      filename: this.item.filename
    });
    this.handleOpenChange(false);
  }

  handleOpenChange(isOpen: boolean) {
    this.openChange.emit(isOpen);
  }

  cancel() {
    this.handleOpenChange(false);
  }

  formatCurrency(amount: number | string): string {
    return parseFloat(String(amount || 0)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
