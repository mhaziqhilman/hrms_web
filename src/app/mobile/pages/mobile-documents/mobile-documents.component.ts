import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '@/core/services/auth.service';
import { FileService, FileMetadata } from '@/core/services/file.service';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import type { ZardIcon } from '@/shared/components/icon/icons';
import { NativeService } from '@/mobile/services/native.service';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';
import { MobileEmptyStateComponent } from '@/mobile/shared/mobile-empty-state.component';

@Component({
  selector: 'app-mobile-documents',
  standalone: true,
  imports: [CommonModule, ZardIconComponent, MobilePageHeaderComponent, MobileEmptyStateComponent],
  template: `
    <section class="space-y-4">
      <app-mobile-page-header title="Documents" subtitle="Your personal files" />

      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-14 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
          }
        </div>
      } @else if (files().length === 0) {
        <app-mobile-empty-state icon="file" title="No documents" subtitle="Files attached to you will appear here." />
      } @else {
        <div class="space-y-2">
          @for (file of files(); track file.id) {
            <button
              type="button"
              (click)="open(file)"
              class="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left dark:border-neutral-800 dark:bg-neutral-900 active:scale-98 transition"
            >
              <div class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                <z-icon [zType]="fileIcon(file.mime_type)" zSize="default"></z-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{{ file.original_filename }}</div>
                <div class="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-500">
                  <span>{{ formatSize(file.file_size) }}</span>
                  <span class="h-1 w-1 rounded-full bg-neutral-300"></span>
                  <span>{{ formatDate(file.uploaded_at) }}</span>
                </div>
              </div>
              <z-icon zType="download" zSize="sm" class="text-neutral-400"></z-icon>
            </button>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileDocumentsComponent implements OnInit {
  private fileService = inject(FileService);
  private auth = inject(AuthService);
  private native = inject(NativeService);

  readonly loading = signal(false);
  readonly files = signal<FileMetadata[]>([]);

  ngOnInit(): void {
    this.loading.set(true);
    const userId = this.auth.currentUserSignal()?.id;
    this.fileService.getFiles({ uploaded_by: userId, limit: 50 } as any).subscribe({
      next: (res: any) => {
        this.files.set(res?.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(file: FileMetadata): void {
    this.native.hapticLight();
    const url = this.fileService.getDownloadUrl(file.id);
    window.open(url, '_blank');
  }

  fileIcon(mime?: string): ZardIcon {
    if (!mime) return 'file';
    if (mime.startsWith('image/')) return 'image';
    if (mime === 'application/pdf' || mime.includes('pdf')) return 'file-text';
    return 'file';
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
  }

  formatDate(s: string): string {
    return new Date(s).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
