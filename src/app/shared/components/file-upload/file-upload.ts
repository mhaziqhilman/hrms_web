import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService, FileUploadMetadata } from '../../../core/services/file.service';

@Component({
  selector: 'app-file-upload',
  imports: [CommonModule],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css',
})
export class FileUpload {
  @Input() acceptedTypes: string = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx,.csv,.zip,.rar';
  @Input() multiple: boolean = true;
  @Input() maxFiles: number = 10;
  @Input() showPreview: boolean = true;
  @Input() autoUpload: boolean = false;
  @Input() metadata!: FileUploadMetadata;

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() uploadComplete = new EventEmitter<any>();
  @Output() uploadError = new EventEmitter<any>();

  selectedFiles = signal<File[]>([]);
  previews = signal<{ file: File; url: string; }[]>([]);
  uploading = signal(false);
  uploadProgress = signal(0);
  dragOver = signal(false);
  errors = signal<string[]>([]);

  constructor(private fileService: FileService) {}

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(Array.from(input.files));
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  private processFiles(files: File[]): void {
    this.errors.set([]);

    // Validate files
    const validation = this.fileService.validateFiles(files);
    if (!validation.valid) {
      this.errors.set(validation.errors);
      return;
    }

    // Check max files limit
    const totalFiles = this.selectedFiles().length + files.length;
    if (totalFiles > this.maxFiles) {
      this.errors.set([`Maximum ${this.maxFiles} files allowed. You have selected ${totalFiles} files.`]);
      return;
    }

    // Add files
    const currentFiles = this.selectedFiles();
    this.selectedFiles.set([...currentFiles, ...files]);

    // Generate previews for images
    if (this.showPreview) {
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const currentPreviews = this.previews();
            this.previews.set([...currentPreviews, {
              file,
              url: e.target?.result as string
            }]);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Emit selected files
    this.filesSelected.emit(this.selectedFiles());

    // Auto upload if enabled
    if (this.autoUpload && this.metadata) {
      this.upload();
    }
  }

  removeFile(index: number): void {
    const files = this.selectedFiles();
    files.splice(index, 1);
    this.selectedFiles.set([...files]);

    const previews = this.previews();
    const previewIndex = previews.findIndex(p => p.file === files[index]);
    if (previewIndex > -1) {
      previews.splice(previewIndex, 1);
      this.previews.set([...previews]);
    }

    this.filesSelected.emit(this.selectedFiles());
  }

  clearFiles(): void {
    this.selectedFiles.set([]);
    this.previews.set([]);
    this.errors.set([]);
    this.filesSelected.emit([]);
  }

  upload(): void {
    if (!this.metadata) {
      this.errors.set(['Upload metadata is required']);
      return;
    }

    if (this.selectedFiles().length === 0) {
      this.errors.set(['No files selected']);
      return;
    }

    this.uploading.set(true);
    this.errors.set([]);

    this.fileService.uploadFiles(this.selectedFiles(), this.metadata).subscribe({
      next: (response) => {
        this.uploading.set(false);
        this.uploadComplete.emit(response);
        this.clearFiles();
      },
      error: (error) => {
        this.uploading.set(false);
        const errorMessage = error.error?.message || 'Upload failed';
        this.errors.set([errorMessage]);
        this.uploadError.emit(error);
      }
    });
  }

  getFileIcon(file: File): string {
    return this.fileService.getFileIcon(file.type);
  }

  formatFileSize(size: number): string {
    return this.fileService.formatFileSize(size);
  }
}
