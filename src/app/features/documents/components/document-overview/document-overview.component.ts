import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';

// Shared file components
import { FileUpload } from '@/shared/components/file-upload/file-upload';
import { FileViewer } from '@/shared/components/file-viewer/file-viewer';

// Services
import {
  FileService,
  FileMetadata,
  DocumentOverviewStats,
  FileUploadMetadata,
  UploaderOption
} from '@/core/services/file.service';
import { DisplayService } from '@/core/services/display.service';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-document-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardTableImports,
    ZardMenuImports,
    ZardDividerComponent,
    ZardCheckboxComponent,
    ZardDatePickerComponent,
    FileUpload,
    FileViewer
  ],
  templateUrl: './document-overview.component.html',
  styleUrls: ['./document-overview.component.css']
})
export class DocumentOverviewComponent implements OnInit, OnDestroy {
  private fileService = inject(FileService);
  private alertDialogService = inject(ZardAlertDialogService);
  private displayService = inject(DisplayService);

  // Loading states
  loading = signal(true);
  error = signal<string | null>(null);
  tableLoading = signal(false);

  // Overview stats
  stats = signal<DocumentOverviewStats>({
    total_documents: 0,
    pending_verification: 0,
    recently_uploaded: 0,
    total_size: 0,
    category_breakdown: [],
    recent_activity: []
  });

  // File list
  files = signal<FileMetadata[]>([]);
  pagination = signal({ total: 0, page: 1, limit: 10, totalPages: 0 });

  // Filters
  searchTerm = signal('');
  categoryFilter = signal('');
  verifiedFilter = signal('');
  ownerFilter = signal<number | null>(null);
  daysFilter = signal<number | null>(null);
  modifiedFrom = signal<Date | null>(null);
  modifiedTo = signal<Date | null>(null);
  sortColumn = signal('uploaded_at');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Uploader list for owner filter
  uploaders = signal<UploaderOption[]>([]);

  // Selection
  selectedFiles = signal<Set<number>>(new Set());

  // UI states
  showUploadDialog = signal(false);
  showModifiedFilter = signal(false);
  viewerFileId = signal<number | null>(null);
  uploadCategory = signal<string>('company_document');
  lastRefresh = signal<Date>(new Date());

  // Search input ref (for ⌘K shortcut)
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  // Sparkline computed signals
  sparkTotal = computed(() => this.computeSpark(this.generateSeries(this.stats().total_documents, 'up'), 'emerald'));
  sparkPending = computed(() => this.computeSpark(this.generateSeries(this.stats().pending_verification, 'down'), 'amber'));
  sparkRecent = computed(() => this.computeSpark(this.generateSeries(this.stats().recently_uploaded, 'up'), 'indigo'));

  // Status pills (for tabs row)
  statusPills = computed(() => {
    const total = this.stats().total_documents;
    const pending = this.stats().pending_verification;
    const verified = Math.max(0, total - pending);
    return [
      { key: 'all',      label: 'All Documents',        count: total,    icon: 'folder' as string | null, dot: null as string | null,         days: null as number | null, verified: '' },
      { key: 'pending',  label: 'Pending Verification', count: pending,  icon: null,                       dot: 'bg-amber-500',                days: null,                  verified: 'false' },
      { key: 'verified', label: 'Verified',             count: verified, icon: null,                       dot: 'bg-emerald-500',              days: null,                  verified: 'true' },
      { key: 'recent',   label: 'Recently Uploaded',    count: this.stats().recently_uploaded, icon: null, dot: 'bg-indigo-500',               days: 7,                     verified: '' },
    ];
  });

  activeStatusPill = computed<string>(() => {
    if (this.daysFilter() === 7) return 'recent';
    const v = this.verifiedFilter();
    if (v === 'true') return 'verified';
    if (v === 'false') return 'pending';
    return 'all';
  });

  // Healthy badge — derived from pending ratio
  healthBadge = computed<{ label: string; bg: string; fg: string; icon: string }>(() => {
    const total = this.stats().total_documents;
    const pending = this.stats().pending_verification;
    if (total === 0) {
      return { label: 'No data', bg: 'bg-muted', fg: 'text-muted-foreground', icon: 'circle-help' };
    }
    const ratio = pending / total;
    if (ratio >= 0.25) {
      return { label: 'Action needed', bg: 'bg-rose-50', fg: 'text-rose-700', icon: 'triangle-alert' };
    }
    if (ratio >= 0.1) {
      return { label: 'Attention', bg: 'bg-amber-50', fg: 'text-amber-700', icon: 'clock' };
    }
    return { label: 'Healthy', bg: 'bg-emerald-50', fg: 'text-emerald-700', icon: 'check' };
  });

  // Expose Math for template
  Math = Math;

  // Search debounce
  private searchTimeout: any = null;

  // Categories for filter
  categories = [
    { value: '', label: 'All Categories' },
    { value: 'employee_document', label: 'Employee Documents' },
    { value: 'claim_receipt', label: 'Claim Receipts' },
    { value: 'payslip', label: 'Payslips' },
    { value: 'leave_document', label: 'Leave Documents' },
    { value: 'company_document', label: 'Company Documents' },
    { value: 'invoice', label: 'Invoices' },
    { value: 'other', label: 'Other' }
  ];

  // Upload metadata
  get uploadMetadata(): FileUploadMetadata {
    return {
      category: this.uploadCategory() as any || 'company_document'
    };
  }

  ngOnInit(): void {
    this.loadOverview();
    this.loadFiles();
    this.loadUploaders();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const isCmdOrCtrl = event.metaKey || event.ctrlKey;
    if (isCmdOrCtrl && (event.key === 'k' || event.key === 'K')) {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
      this.searchInput?.nativeElement.select();
    }
  }

  loadUploaders(): void {
    this.fileService.getUploaders().subscribe({
      next: (response) => {
        if (response.success) {
          this.uploaders.set(response.data);
        }
      },
      error: (err) => console.error('Error loading uploaders:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  loadOverview(): void {
    this.fileService.getDocumentOverview().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.set(response.data);
        }
        this.loading.set(false);
        this.lastRefresh.set(new Date());
      },
      error: (err) => {
        console.error('Error loading document overview:', err);
        this.error.set('Failed to load document overview.');
        this.loading.set(false);
      }
    });
  }

  loadFiles(): void {
    this.tableLoading.set(true);

    const filters: any = {
      page: this.pagination().page,
      limit: this.pagination().limit,
      sort: this.sortColumn(),
      order: this.sortDirection()
    };

    if (this.searchTerm()) filters.search = this.searchTerm();
    if (this.categoryFilter()) filters.category = this.categoryFilter();
    if (this.verifiedFilter() !== '') filters.is_verified = this.verifiedFilter();
    if (this.ownerFilter()) filters.uploaded_by = this.ownerFilter();
    if (this.daysFilter()) filters.days = this.daysFilter();
    if (this.modifiedFrom()) filters.modified_from = this.modifiedFrom()!.toISOString().slice(0, 10);
    if (this.modifiedTo()) filters.modified_to = this.modifiedTo()!.toISOString().slice(0, 10);

    this.fileService.getFiles(filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.files.set(response.data);
          this.pagination.set(response.pagination);
        }
        this.tableLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading files:', err);
        this.tableLoading.set(false);
      }
    });
  }

  // Search with debounce
  onSearch(term: string): void {
    this.searchTerm.set(term);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.pagination.update(p => ({ ...p, page: 1 }));
      this.loadFiles();
    }, 400);
  }

  onCategoryFilter(category: string): void {
    this.categoryFilter.set(category);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadFiles();
  }

  onVerifiedFilter(status: string): void {
    this.verifiedFilter.set(status);
    // Clear days filter when picking a verified status
    if (status !== '') this.daysFilter.set(null);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadFiles();
  }

  onOwnerFilter(uploaderId: number | null): void {
    this.ownerFilter.set(uploaderId);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadFiles();
  }

  onDaysFilter(days: number | null): void {
    this.daysFilter.set(days);
    // Clear verified filter so "Recently Uploaded" pill shows all recent files
    if (days !== null) this.verifiedFilter.set('');
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadFiles();
  }

  onModifiedFromChange(date: Date | null): void {
    this.modifiedFrom.set(date);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadFiles();
  }

  onModifiedToChange(date: Date | null): void {
    this.modifiedTo.set(date);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadFiles();
  }

  clearModifiedRange(): void {
    this.modifiedFrom.set(null);
    this.modifiedTo.set(null);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadFiles();
  }

  // Selected status pill: routes between days filter and verified filter
  selectStatusPill(key: string): void {
    const pill = this.statusPills().find(p => p.key === key);
    if (!pill) return;
    if (pill.days !== null) {
      this.onDaysFilter(pill.days);
    } else {
      this.daysFilter.set(null);
      this.onVerifiedFilter(pill.verified);
    }
  }

  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
    this.loadFiles();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return 'arrow-up-down';
    return this.sortDirection() === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  // Pagination
  onPageChange(page: number): void {
    if (page < 1 || page > this.pagination().totalPages) return;
    this.pagination.update(p => ({ ...p, page }));
    this.loadFiles();
  }

  setRowsPerPage(limit: number): void {
    this.pagination.update(p => ({ ...p, limit, page: 1 }));
    this.loadFiles();
  }

  setSort(column: string, direction: 'asc' | 'desc'): void {
    this.sortColumn.set(column);
    this.sortDirection.set(direction);
    this.loadFiles();
  }

  getPageNumbers(): number[] {
    const total = this.pagination().totalPages;
    const current = this.pagination().page;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    if (total > 1) pages.push(total);
    return pages;
  }

  // Selection
  toggleSelectAll(): void {
    const currentFiles = this.files();
    const selected = this.selectedFiles();
    if (selected.size === currentFiles.length) {
      this.selectedFiles.set(new Set());
    } else {
      this.selectedFiles.set(new Set(currentFiles.map(f => f.id)));
    }
  }

  clearSelection(): void {
    this.selectedFiles.set(new Set());
  }

  toggleFileSelection(fileId: number): void {
    const selected = new Set(this.selectedFiles());
    if (selected.has(fileId)) {
      selected.delete(fileId);
    } else {
      selected.add(fileId);
    }
    this.selectedFiles.set(selected);
  }

  isFileSelected(fileId: number): boolean {
    return this.selectedFiles().has(fileId);
  }

  get isAllSelected(): boolean {
    return this.files().length > 0 && this.selectedFiles().size === this.files().length;
  }

  // Actions
  onViewFile(file: FileMetadata): void {
    this.viewerFileId.set(file.id);
  }

  onCloseViewer(): void {
    this.viewerFileId.set(null);
  }

  onDownloadFile(file: FileMetadata): void {
    this.fileService.downloadAndSaveFile(file.id, file.original_filename).subscribe();
  }

  onVerifyFile(file: FileMetadata): void {
    const newStatus = !file.is_verified;
    this.fileService.verifyFile(file.id, newStatus).subscribe({
      next: () => {
        this.loadFiles();
        this.loadOverview();
      },
      error: (err) => {
        console.error('Error verifying file:', err);
      }
    });
  }

  onDeleteFile(file: FileMetadata): void {
    this.alertDialogService.confirm({
      zTitle: 'Delete Document',
      zDescription: `Are you sure you want to delete "${file.original_filename}"? This action can be undone by an administrator.`,
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.fileService.deleteFile(file.id).subscribe({
          next: () => {
            this.loadFiles();
            this.loadOverview();
          },
          error: (err) => console.error('Error deleting file:', err)
        });
      }
    });
  }

  onBulkDelete(): void {
    const selectedIds = Array.from(this.selectedFiles());
    if (selectedIds.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: 'Delete Selected Documents',
      zDescription: `Are you sure you want to delete ${selectedIds.length} document(s)?`,
      zOkText: 'Delete All',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.fileService.bulkDeleteFiles(selectedIds).subscribe({
          next: () => {
            this.selectedFiles.set(new Set());
            this.loadFiles();
            this.loadOverview();
          },
          error: (err) => console.error('Error bulk deleting:', err)
        });
      }
    });
  }

  onBulkVerify(): void {
    const selectedIds = Array.from(this.selectedFiles());
    if (selectedIds.length === 0) return;

    this.fileService.bulkVerifyFiles(selectedIds, true).subscribe({
      next: () => {
        this.selectedFiles.set(new Set());
        this.loadFiles();
        this.loadOverview();
      },
      error: (err) => console.error('Error bulk verifying:', err)
    });
  }

  onBulkDownload(): void {
    const selectedIds = Array.from(this.selectedFiles());
    if (selectedIds.length === 0) return;

    this.fileService.bulkDownloadAndSave(selectedIds).subscribe({
      error: (err) => console.error('Error bulk downloading:', err)
    });
  }

  // Upload
  onUploadComplete(event: any): void {
    this.showUploadDialog.set(false);
    this.loadFiles();
    this.loadOverview();
  }

  // Helpers
  formatFileSize(bytes: number): string {
    return this.fileService.formatFileSize(bytes);
  }

  getFileIcon(mimeType: string): string {
    return this.fileService.getFileIcon(mimeType);
  }

  getCategoryLabel(category: string): string {
    return this.fileService.getCategoryLabel(category);
  }

  getCategoryColor(category: string): string {
    return this.fileService.getCategoryColor(category);
  }

  getStoragePercentage(): number {
    const totalBytes = this.stats().total_size;
    const maxBytes = 1 * 1024 * 1024 * 1024; // 1 GB
    return Math.min(Math.round((totalBytes / maxBytes) * 100), 100);
  }

  getCategoryProgress(count: number): number {
    const total = this.stats().total_documents;
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  getCategoryProgressType(category: string): string {
    const types: Record<string, string> = {
      'employee_document': 'default',
      'claim_receipt': 'accent',
      'payslip': 'default',
      'leave_document': 'destructive',
      'company_document': 'accent',
      'invoice': 'default',
      'other': 'default'
    };
    return types[category] || 'default';
  }

  getUploaderInitials(file: FileMetadata): string {
    if (!file.uploader) return '?';
    const name = file.uploader.employee?.full_name || file.uploader.name || file.uploader.email;
    const parts = name.split(' ');
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
    return (first + last).toUpperCase() || '?';
  }

  getUploaderName(file: FileMetadata): string {
    if (!file.uploader) return 'Unknown';
    return file.uploader.employee?.full_name || file.uploader.name || file.uploader.email;
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatDate(dateStr: string): string {
    return this.displayService.formatDate(dateStr);
  }

  getExtensionLabel(ext: string): string {
    return (ext || '').replace('.', '').toUpperCase();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set('');
    this.verifiedFilter.set('');
    this.ownerFilter.set(null);
    this.daysFilter.set(null);
    this.modifiedFrom.set(null);
    this.modifiedTo.set(null);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadFiles();
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.searchTerm() ||
      this.categoryFilter() ||
      this.verifiedFilter() ||
      this.ownerFilter() ||
      this.daysFilter() ||
      this.modifiedFrom() ||
      this.modifiedTo()
    );
  }

  getOwnerLabel(): string {
    const id = this.ownerFilter();
    if (!id) return 'Owner';
    return this.uploaders().find(u => u.id === id)?.name || 'Owner';
  }

  getModifiedLabel(): string {
    const from = this.modifiedFrom();
    const to = this.modifiedTo();
    if (!from && !to) return 'Modified';
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (from && to) return `${fmt(from)} – ${fmt(to)}`;
    if (from) return `From ${fmt(from)}`;
    return `Until ${fmt(to!)}`;
  }

  getTodayDate(): string {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // ===== Design helpers =====

  // --- Sparkline helpers ---
  generateSeries(current: number, trend: 'up' | 'down' | 'flat'): number[] {
    const n = 12;
    if (current <= 0) {
      return Array.from({ length: n }, (_, i) => i * 0.1);
    }
    const series: number[] = [];
    if (trend === 'up') {
      const start = Math.max(1, Math.floor(current * 0.65));
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const variance = Math.sin(i * 1.7) * Math.max(1, (current - start)) * 0.06;
        series.push(Math.max(0, Math.round(start + (current - start) * t + variance)));
      }
    } else if (trend === 'down') {
      const start = Math.max(current + 2, Math.floor(current * 1.5));
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const variance = Math.sin(i * 1.3) * Math.max(1, (start - current)) * 0.06;
        series.push(Math.max(0, Math.round(start - (start - current) * t + variance)));
      }
    } else {
      for (let i = 0; i < n; i++) series.push(current);
    }
    series[n - 1] = current;
    return series;
  }

  computeSpark(values: number[], tone: 'emerald' | 'amber' | 'indigo' | 'rose' | 'slate') {
    const w = 240, h = 44, pad = 2;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = (w - pad * 2) / (values.length - 1);
    const pts = values.map((v, i) => ({
      x: pad + i * stepX,
      y: h - pad - ((v - min) / range) * (h - pad * 2),
    }));
    const line = pts
      .map((p, i) => (i === 0 ? `M${p.x.toFixed(2)},${p.y.toFixed(2)}` : `L${p.x.toFixed(2)},${p.y.toFixed(2)}`))
      .join(' ');
    const last = pts[pts.length - 1];
    const first = pts[0];
    const area = `${line} L${last.x.toFixed(2)},${(h - pad).toFixed(2)} L${first.x.toFixed(2)},${(h - pad).toFixed(2)} Z`;
    const tones: Record<string, { stroke: string; grad: string }> = {
      emerald: { stroke: 'rgb(16 185 129)', grad: 'gEmerald' },
      rose: { stroke: 'rgb(225 29 72)', grad: 'gRose' },
      slate: { stroke: 'rgb(15 23 42)', grad: 'gSlate' },
      amber: { stroke: 'rgb(217 119 6)', grad: 'gAmber' },
      indigo: { stroke: 'rgb(79 70 229)', grad: 'gIndigo' },
    };
    const t = tones[tone];
    const first0 = values[0] || 1;
    const delta = ((values[values.length - 1] - values[0]) / first0) * 100;
    return {
      line,
      area,
      lastX: last.x,
      lastY: last.y,
      gradId: t.grad,
      stroke: t.stroke,
      delta,
      viewBox: `0 0 ${w} ${h}`,
      height: h,
    };
  }

  // --- Category styling ---
  getCategoryDotClass(category: string): string {
    const map: Record<string, string> = {
      employee_document: 'bg-indigo-500',
      claim_receipt: 'bg-emerald-500',
      payslip: 'bg-emerald-500',
      leave_document: 'bg-rose-500',
      company_document: 'bg-amber-500',
      invoice: 'bg-violet-500',
      other: 'bg-slate-400',
    };
    return map[category] || 'bg-slate-400';
  }

  getCategoryChipClass(category: string): string {
    const map: Record<string, string> = {
      employee_document: 'bg-indigo-100 text-indigo-700',
      claim_receipt: 'bg-emerald-100 text-emerald-700',
      payslip: 'bg-emerald-100 text-emerald-700',
      leave_document: 'bg-rose-100 text-rose-700',
      company_document: 'bg-amber-100 text-amber-700',
      invoice: 'bg-violet-100 text-violet-700',
      other: 'bg-slate-100 text-slate-700',
    };
    return map[category] || 'bg-slate-100 text-slate-700';
  }

  // --- File kind styling (PDF, DOC, XLS, ZIP, IMG, FILE) ---
  getFileKind(ext: string | undefined, mime?: string): 'pdf' | 'doc' | 'xls' | 'zip' | 'img' | 'other' {
    const e = (ext || '').toLowerCase().replace('.', '');
    if (e === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(e)) return 'doc';
    if (['xls', 'xlsx', 'csv'].includes(e)) return 'xls';
    if (['zip', 'rar', '7z'].includes(e)) return 'zip';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(e)) return 'img';
    if (mime?.startsWith('image/')) return 'img';
    if (mime === 'application/pdf') return 'pdf';
    return 'other';
  }

  getFileKindBg(file: FileMetadata): string {
    const map: Record<string, string> = {
      pdf: 'bg-rose-50 text-rose-600',
      doc: 'bg-indigo-50 text-indigo-600',
      xls: 'bg-emerald-50 text-emerald-600',
      zip: 'bg-amber-50 text-amber-600',
      img: 'bg-violet-50 text-violet-600',
      other: 'bg-slate-100 text-slate-600',
    };
    return map[this.getFileKind(file.file_extension, file.mime_type)] || map['other'];
  }

  getFileKindLabel(file: FileMetadata): string {
    const k = this.getFileKind(file.file_extension, file.mime_type);
    const map: Record<string, string> = { pdf: 'PDF', doc: 'DOC', xls: 'XLS', zip: 'ZIP', img: 'IMG', other: 'FILE' };
    return map[k];
  }

  // --- Owner avatar gradient (deterministic from name) ---
  getOwnerTone(name: string): string {
    const tones = [
      'from-violet-500 to-violet-700',
      'from-amber-500 to-amber-700',
      'from-emerald-500 to-emerald-700',
      'from-indigo-500 to-indigo-700',
      'from-rose-500 to-rose-700',
      'from-sky-500 to-sky-700',
    ];
    if (!name) return tones[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = ((hash * 31) + name.charCodeAt(i)) >>> 0;
    return tones[hash % tones.length];
  }

  // --- Status chip ---
  getStatusClass(file: FileMetadata): string {
    return file.is_verified
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : 'bg-amber-50 text-amber-700 ring-amber-200';
  }

  getStatusLabel(file: FileMetadata): string {
    return file.is_verified ? 'Verified' : 'Pending';
  }

  // --- Refresh "ago" indicator ---
  getRefreshAgo(): string {
    return this.getTimeAgo(this.lastRefresh().toISOString());
  }

  // --- Date short formatting for "Modified" cell ---
  getModifiedShort(dateStr: string): string {
    return this.getTimeAgo(dateStr);
  }

  // --- Verified count for header pill ---
  getVerifiedCount(): number {
    return Math.max(0, this.stats().total_documents - this.stats().pending_verification);
  }
}
