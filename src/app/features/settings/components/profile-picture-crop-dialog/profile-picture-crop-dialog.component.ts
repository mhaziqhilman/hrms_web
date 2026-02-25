import { Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCropperComponent, ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

export interface CropDialogData {
  imageFile: File;
}

export interface CropDialogResult {
  croppedFile: File;
}

@Component({
  selector: 'app-profile-picture-crop-dialog',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent, ZardButtonComponent, ZardIconComponent],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-center rounded-lg bg-muted/30 overflow-hidden"
           style="min-height: 300px; max-height: 400px;">
        <image-cropper
          #cropper
          [imageFile]="data.imageFile"
          [maintainAspectRatio]="true"
          [aspectRatio]="1"
          [roundCropper]="true"
          [resizeToWidth]="400"
          [resizeToHeight]="400"
          format="webp"
          output="blob"
          [transform]="transform"
          [imageQuality]="80"
          (imageCropped)="onImageCropped($event)"
          (imageLoaded)="onImageLoaded()"
          (loadImageFailed)="onLoadFailed()"
        />
      </div>

      <!-- Zoom Controls -->
      <div class="flex items-center justify-center gap-3">
        <button z-button zType="outline" zSize="sm" (click)="zoomOut()" [disabled]="scale() <= 0.5">
          <z-icon zType="minus" class="h-4 w-4" />
        </button>
        <span class="text-sm text-muted-foreground w-16 text-center">{{ Math.round(scale() * 100) }}%</span>
        <button z-button zType="outline" zSize="sm" (click)="zoomIn()" [disabled]="scale() >= 3">
          <z-icon zType="plus" class="h-4 w-4" />
        </button>
        <button z-button zType="outline" zSize="sm" (click)="resetZoom()">
          <z-icon zType="refresh-cw" class="h-4 w-4" />
        </button>
      </div>

      @if (!imageLoaded()) {
        <div class="flex items-center justify-center py-4">
          <z-icon zType="loader-2" class="h-6 w-6 animate-spin text-muted-foreground" />
          <span class="ml-2 text-sm text-muted-foreground">Loading image...</span>
        </div>
      }
    </div>
  `
})
export class ProfilePictureCropDialogComponent {
  dialogRef = inject(ZardDialogRef);
  data: CropDialogData = inject(Z_MODAL_DATA);

  @ViewChild('cropper') cropperRef!: ImageCropperComponent;

  Math = Math;
  scale = signal(1);
  imageLoaded = signal(false);
  transform: ImageTransform = {};

  private croppedBlob: Blob | null = null;

  onImageCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  onImageLoaded(): void {
    this.imageLoaded.set(true);
  }

  onLoadFailed(): void {
    this.imageLoaded.set(false);
  }

  zoomIn(): void {
    const newScale = Math.min(this.scale() + 0.1, 3);
    this.scale.set(newScale);
    this.transform = { ...this.transform, scale: newScale };
  }

  zoomOut(): void {
    const newScale = Math.max(this.scale() - 0.1, 0.5);
    this.scale.set(newScale);
    this.transform = { ...this.transform, scale: newScale };
  }

  resetZoom(): void {
    this.scale.set(1);
    this.transform = { ...this.transform, scale: 1 };
  }

  getCroppedFile(): File | null {
    if (!this.croppedBlob) return null;
    const originalName = this.data.imageFile.name.replace(/\.[^.]+$/, '.webp');
    return new File([this.croppedBlob], originalName, { type: 'image/webp' });
  }
}
