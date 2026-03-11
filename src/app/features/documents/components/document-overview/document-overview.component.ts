import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardProgressBarComponent } from '@/shared/components/progress-bar/progress-bar.component';
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
  FileUploadMetadata
} from '@/core/services/file.service';
import { DisplayService } from '@/core/services/display.service';

@Component({
  selector: 'app-document-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardTableImports,
    ZardMenuImports,
    ZardAvatarComponent,
    ZardProgressBarComponent,
    ZardDividerComponent,
    ZardCheckboxComponent,
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
  sortColumn = signal('uploaded_at');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Selection
  selectedFiles = signal<Set<number>>(new Set());

  // UI states
  showUploadDialog = signal(false);
  viewerFileId = signal<number | null>(null);
  uploadCategory = signal<string>('company_document');

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
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadFiles();
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
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadFiles();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchTerm() || this.categoryFilter() || this.verifiedFilter());
  }

  getTodayDate(): string {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
