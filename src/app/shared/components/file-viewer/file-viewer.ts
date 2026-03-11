import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, ElementRef, ViewChild, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { toast } from 'ngx-sonner';
import { FileService, FileMetadata } from '../../../core/services/file.service';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { DisplayService } from '@/core/services/display.service';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.mjs';

@Component({
  selector: 'app-file-viewer',
  imports: [ZardIconComponent, ZardButtonComponent],
  templateUrl: './file-viewer.html',
  styleUrl: './file-viewer.css',
})
export class FileViewer implements OnInit, OnDestroy {
  @Input() fileId?: number;
  @Input() file?: FileMetadata;
  @Input() showHeader: boolean = true;
  @Input() showActions: boolean = true;

  @Output() closed = new EventEmitter<void>();
  @Output() downloaded = new EventEmitter<FileMetadata>();
  @Output() deleted = new EventEmitter<number>();

  @ViewChild('pdfContainer') pdfContainer!: ElementRef<HTMLDivElement>;

  fileMetadata = signal<FileMetadata | null>(null);
  previewUrl = signal<SafeResourceUrl | null>(null);
  pdfLoaded = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  viewMode = signal<'preview' | 'download'>('preview');
  previewFailed = signal(false);

  private pdfBlobUrl: string | null = null;
  private displayService = inject(DisplayService);

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
        if (this.isPDF()) {
          this.renderPdf(blob);
        } else {
          const url = window.URL.createObjectURL(blob);
          this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
          this.loading.set(false);
        }
      },
      error: () => {
        this.previewFailed.set(true);
        this.viewMode.set('download');
        this.loading.set(false);
        toast.error('Preview blocked — try disabling your ad blocker or browser extensions for this site.', { duration: 6000 });
      }
    });
  }

  private async renderPdf(blob: Blob): Promise<void> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Wait for the container to be available via change detection
      this.pdfLoaded.set(true);
      this.loading.set(false);

      // Give Angular a tick to render the container
      await new Promise(resolve => setTimeout(resolve, 0));

      const container = this.pdfContainer?.nativeElement;
      if (!container) return;

      container.innerHTML = '';
      const containerWidth = container.clientWidth || 800;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = (containerWidth - 16) / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width * (window.devicePixelRatio || 1);
        canvas.height = viewport.height * (window.devicePixelRatio || 1);
        canvas.style.width = '100%';
        canvas.style.maxWidth = `${viewport.width}px`;
        canvas.style.height = 'auto';
        canvas.style.display = 'block';
        canvas.style.marginBottom = '8px';
        canvas.style.borderRadius = '4px';
        canvas.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

        const ctx = canvas.getContext('2d')!;
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

        await page.render({ canvasContext: ctx, viewport }).promise;
        container.appendChild(canvas);
      }
    } catch (err) {
      this.pdfLoaded.set(false);
      this.previewFailed.set(true);
      this.viewMode.set('download');
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.pdfBlobUrl) {
      window.URL.revokeObjectURL(this.pdfBlobUrl);
    }
  }

  downloadFile(): void {
    const file = this.fileMetadata();
    if (!file) return;

    this.fileService.downloadAndSaveFile(file.id, file.original_filename).subscribe({
      next: () => {
        this.downloaded.emit(file);
      },
      error: (err) => {
        toast.error(err.error?.message || 'Failed to download file. Try disabling your ad blocker if the issue persists.');
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
        error: (err) => {
          toast.error(err.error?.message || 'Failed to delete file');
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
    return this.displayService.formatDate(date);
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

  getFileExtension(): string {
    const meta = this.fileMetadata();
    if (!meta) return '';
    const ext = meta.file_extension || meta.original_filename.split('.').pop() || '';
    return ext.replace(/^\./, '').toUpperCase();
  }

  getExtensionColor(): string {
    const ext = this.getFileExtension().toLowerCase();
    const colors: Record<string, string> = {
      pdf: 'bg-red-500',
      doc: 'bg-blue-600',
      docx: 'bg-blue-600',
      xls: 'bg-emerald-600',
      xlsx: 'bg-emerald-600',
      csv: 'bg-emerald-600',
      jpg: 'bg-violet-500',
      jpeg: 'bg-violet-500',
      png: 'bg-violet-500',
      gif: 'bg-violet-500',
      webp: 'bg-violet-500',
      svg: 'bg-violet-500',
      zip: 'bg-amber-500',
      rar: 'bg-amber-500',
      txt: 'bg-slate-500',
    };
    return colors[ext] || 'bg-slate-500';
  }
}
