import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService, FileMetadata } from '../../../core/services/file.service';
import { FileViewer } from '../file-viewer/file-viewer';
import { ZardIconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-file-list',
  imports: [CommonModule, FileViewer, ZardIconComponent],
  templateUrl: './file-list.html',
  styleUrl: './file-list.css',
})
export class FileList implements OnInit, OnDestroy {
  @Input() category?: string;
  @Input() relatedToEmployeeId?: number;
  @Input() relatedToClaimId?: number;
  @Input() relatedToLeaveId?: number;
  @Input() showActions: boolean = true;
  @Input() showFilters: boolean = true;
  @Input() maxDisplay?: number;
  @Input() displayMode: 'grid' | 'compact' = 'grid';

  @Output() fileDeleted = new EventEmitter<number>();
  @Output() fileDownloaded = new EventEmitter<FileMetadata>();

  files = signal<FileMetadata[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Modal for file preview
  showPreviewModal = signal(false);
  previewingFile = signal<FileMetadata | null>(null);

  // Image preview URLs (using blob URLs to avoid CORS/auth issues)
  imagePreviewUrls = signal<Map<number, string>>(new Map());

  // Filters
  selectedCategory = signal<string>('all');
  searchTerm = signal<string>('');
  sortBy = signal<'date' | 'name' | 'size'>('date');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  categories = [
    { value: 'all', label: 'All Files' },
    { value: 'employee_document', label: 'Employee Documents' },
    { value: 'claim_receipt', label: 'Claim Receipts' },
    { value: 'payslip', label: 'Payslips' },
    { value: 'leave_document', label: 'Leave Documents' },
    { value: 'company_document', label: 'Company Documents' },
    { value: 'invoice', label: 'Invoices' },
    { value: 'other', label: 'Other' }
  ];

  constructor(private fileService: FileService) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  ngOnDestroy(): void {
    // Clean up blob URLs to prevent memory leaks
    const urls = this.imagePreviewUrls();
    urls.forEach(url => URL.revokeObjectURL(url));
  }

  loadFiles(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: any = {
      page: this.currentPage(),
      limit: this.maxDisplay || this.itemsPerPage(),
      sort_by: this.sortBy(),
      order: this.sortOrder()
    };

    if (this.category) {
      filters.category = this.category;
    } else if (this.selectedCategory() !== 'all') {
      filters.category = this.selectedCategory();
    }

    if (this.searchTerm()) {
      filters.search = this.searchTerm();
    }

    if (this.relatedToEmployeeId) {
      filters.related_to_employee_id = this.relatedToEmployeeId;
    }

    if (this.relatedToClaimId) {
      filters.related_to_claim_id = this.relatedToClaimId;
    }

    if (this.relatedToLeaveId) {
      filters.related_to_leave_id = this.relatedToLeaveId;
    }

    this.fileService.getFiles(filters).subscribe({
      next: (response) => {
        this.files.set(response.data);
        this.totalItems.set(response.pagination.total);
        this.totalPages.set(response.pagination.totalPages);
        this.loading.set(false);

        // Load image previews for image files
        this.loadImagePreviews(response.data);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Failed to load files');
        this.loading.set(false);
      }
    });
  }

  loadImagePreviews(files: FileMetadata[]): void {
    // Clean up old blob URLs
    const oldUrls = this.imagePreviewUrls();
    oldUrls.forEach(url => URL.revokeObjectURL(url));

    const newUrls = new Map<number, string>();

    // Load preview for each image file
    files.forEach(file => {
      if (file.mime_type.startsWith('image/')) {
        this.fileService.previewFile(file.id).subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob);
            newUrls.set(file.id, url);
            this.imagePreviewUrls.set(new Map(newUrls));
          },
          error: (error) => {
            console.error(`Failed to load preview for file ${file.id}:`, error);
          }
        });
      }
    });
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
    this.loadFiles();
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.currentPage.set(1);
    this.loadFiles();
  }

  onSortChange(sortBy: 'date' | 'name' | 'size'): void {
    if (this.sortBy() === sortBy) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(sortBy);
      this.sortOrder.set('desc');
    }
    this.loadFiles();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadFiles();
  }

  downloadFile(file: FileMetadata): void {
    this.fileService.downloadAndSaveFile(file.id, file.original_filename).subscribe({
      next: () => {
        this.fileDownloaded.emit(file);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Failed to download file');
      }
    });
  }

  previewFile(file: FileMetadata): void {
    this.previewingFile.set(file);
    this.showPreviewModal.set(true);
  }

  closePreviewModal(): void {
    this.showPreviewModal.set(false);
    this.previewingFile.set(null);
  }

  deleteFile(file: FileMetadata): void {
    if (confirm(`Are you sure you want to delete "${file.original_filename}"?`)) {
      this.fileService.deleteFile(file.id).subscribe({
        next: () => {
          this.fileDeleted.emit(file.id);
          this.loadFiles();
        },
        error: (error) => {
          this.error.set(error.error?.message || 'Failed to delete file');
        }
      });
    }
  }

  canPreview(mimeType: string): boolean {
    return this.fileService.canPreview(mimeType);
  }

  getFileIcon(mimeType: string): string {
    return this.fileService.getFileIcon(mimeType);
  }

  formatFileSize(size: number): string {
    return this.fileService.formatFileSize(size);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  getImagePreviewUrl(fileId: number): string | undefined {
    return this.imagePreviewUrls().get(fileId);
  }

  get paginationPages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, -1, total);
      } else if (current >= total - 3) {
        pages.push(1, -1, total - 4, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, -1, current - 1, current, current + 1, -1, total);
      }
    }

    return pages;
  }
}
