import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileService, FileMetadata } from '../../../core/services/file.service';

@Component({
  selector: 'app-file-viewer',
  imports: [CommonModule],
  templateUrl: './file-viewer.html',
  styleUrl: './file-viewer.css',
})
export class FileViewer implements OnInit {
  @Input() fileId?: number;
  @Input() file?: FileMetadata;
  @Input() showHeader: boolean = true;
  @Input() showActions: boolean = true;

  @Output() closed = new EventEmitter<void>();
  @Output() downloaded = new EventEmitter<FileMetadata>();
  @Output() deleted = new EventEmitter<number>();

  fileMetadata = signal<FileMetadata | null>(null);
  previewUrl = signal<SafeResourceUrl | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  viewMode = signal<'preview' | 'download'>('preview');

  constructor(
    private fileService: FileService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    if (this.file) {
      this.fileMetadata.set(this.file);
      this.loadPreview();
    } else if (this.fileId) {
      this.loadFileMetadata();
    }
  }

  loadFileMetadata(): void {
    if (!this.fileId) return;

    this.loading.set(true);
    this.fileService.getFileById(this.fileId).subscribe({
      next: (response) => {
        if (!response.data) {
          this.error.set('File not found');
          this.loading.set(false);
          return;
        }
        
        // Handle array case (shouldn't happen for getFileById, but type allows it)
        const fileMetadata = Array.isArray(response.data) ? response.data[0] : response.data;
        this.fileMetadata.set(fileMetadata);
        this.loadPreview();
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Failed to load file');
        this.loading.set(false);
      }
    });
  }

  loadPreview(): void {
    const file = this.fileMetadata();
    if (!file) return;

    if (!this.canPreview(file.mime_type)) {
      this.viewMode.set('download');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.fileService.previewFile(file.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Failed to load preview');
        this.viewMode.set('download');
        this.loading.set(false);
      }
    });
  }

  downloadFile(): void {
    const file = this.fileMetadata();
    if (!file) return;

    this.fileService.downloadAndSaveFile(file.id, file.original_filename).subscribe({
      next: () => {
        this.downloaded.emit(file);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Failed to download file');
      }
    });
  }

  deleteFile(): void {
    const file = this.fileMetadata();
    if (!file) return;

    if (confirm(`Are you sure you want to delete "${file.original_filename}"?`)) {
      this.fileService.deleteFile(file.id).subscribe({
        next: () => {
          this.deleted.emit(file.id);
          this.close();
        },
        error: (error) => {
          this.error.set(error.error?.message || 'Failed to delete file');
        }
      });
    }
  }

  close(): void {
    this.closed.emit();
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCategoryLabel(category: string): string {
    const categories: Record<string, string> = {
      employee_document: 'Employee Document',
      claim_receipt: 'Claim Receipt',
      payslip: 'Payslip',
      leave_document: 'Leave Document',
      company_document: 'Company Document',
      invoice: 'Invoice',
      other: 'Other'
    };
    return categories[category] || category;
  }

  isImage(): boolean {
    return this.fileMetadata()?.mime_type.startsWith('image/') || false;
  }

  isPDF(): boolean {
    return this.fileMetadata()?.mime_type === 'application/pdf' || false;
  }
}
