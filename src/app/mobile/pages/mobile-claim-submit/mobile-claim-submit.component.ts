import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@/core/services/auth.service';
import { ClaimService } from '@/features/claims/services/claim.service';
import { FileService } from '@/core/services/file.service';
import type { ClaimType } from '@/features/claims/models/claim.model';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { NativeService } from '@/mobile/services/native.service';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';

@Component({
  selector: 'app-mobile-claim-submit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ZardIconComponent, MobilePageHeaderComponent],
  template: `
    <section class="space-y-5">
      <app-mobile-page-header title="New claim" subtitle="Submit an expense">
        <a
          slot="action"
          routerLink="/m/claims"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 active:scale-95"
          aria-label="Back"
        >
          <z-icon zType="chevron-left" zSize="default"></z-icon>
        </a>
      </app-mobile-page-header>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <!-- Receipt (image or PDF) -->
        <div class="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          @if (receiptPreview()) {
            <div class="relative">
              @if (receiptKind() === 'image') {
                <img [src]="receiptPreview()" alt="Receipt" class="w-full rounded-xl object-cover max-h-64" />
              } @else {
                <div class="flex items-center gap-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/60">
                  <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    <z-icon zType="file" zSize="lg"></z-icon>
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{{ receiptName() }}</div>
                    <div class="text-xs text-neutral-500">PDF document</div>
                  </div>
                </div>
              }
              <button
                type="button"
                (click)="clearReceipt()"
                class="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur active:scale-90"
                aria-label="Remove receipt"
              >
                <z-icon zType="x" zSize="sm"></z-icon>
              </button>
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center gap-3 py-6 text-center">
              <span class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <z-icon zType="image" zSize="lg"></z-icon>
              </span>
              <div>
                <div class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Add receipt</div>
                <div class="text-xs text-neutral-500">Photo, gallery image, or PDF</div>
              </div>
              <div class="mt-1 grid w-full grid-cols-2 gap-2">
                <button
                  type="button"
                  (click)="captureReceipt()"
                  class="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2.5 text-xs font-semibold text-white active:scale-98"
                >
                  <z-icon zType="image" zSize="sm"></z-icon>
                  Photo
                </button>
                <button
                  type="button"
                  (click)="pickFile()"
                  class="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 active:scale-98"
                >
                  <z-icon zType="file" zSize="sm"></z-icon>
                  Browse file
                </button>
              </div>
            </div>
          }
          <input
            #fileInput
            type="file"
            accept="image/*,application/pdf"
            class="hidden"
            (change)="onFileSelected($event)"
          />
        </div>

        <!-- Type -->
        <div>
          <label class="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Claim type</label>
          <div class="grid grid-cols-2 gap-2">
            @for (type of types(); track type.id) {
              <button
                type="button"
                (click)="selectType(type.id)"
                class="rounded-2xl border p-3 text-left transition"
                [class]="form.value.claim_type_id === type.id
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'"
              >
                <div class="text-sm font-semibold truncate" [class]="form.value.claim_type_id === type.id ? 'text-amber-700 dark:text-amber-300' : 'text-neutral-900 dark:text-neutral-100'">
                  {{ type.name }}
                </div>
                @if (type.max_amount) {
                  <div class="mt-0.5 text-[11px] text-neutral-500">Max {{ type.max_amount }}</div>
                }
              </button>
            }
          </div>
        </div>

        <!-- Date + Amount -->
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Date</span>
            <input
              type="date"
              formControlName="date"
              class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15"
            />
          </label>
          <label class="block">
            <span class="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Amount (MYR)</span>
            <input
              type="number"
              inputmode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              formControlName="amount"
              class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm tabular-nums dark:border-neutral-800 dark:bg-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15"
            />
          </label>
        </div>

        <!-- Description -->
        <label class="block">
          <span class="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Description</span>
          <textarea
            formControlName="description"
            rows="3"
            placeholder="What is this claim for?"
            class="w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15"
          ></textarea>
        </label>

        @if (error()) {
          <div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            {{ error() }}
          </div>
        }

        <button
          type="submit"
          [disabled]="form.invalid || submitting()"
          class="w-full rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 active:scale-98 transition disabled:opacity-50"
        >
          @if (submitting()) {
            <span class="inline-flex items-center justify-center gap-2">
              <z-icon zType="loader-circle" zSize="sm" class="animate-spin"></z-icon>
              Submitting…
            </span>
          } @else {
            Submit claim
          }
        </button>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileClaimSubmitComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private claimService = inject(ClaimService);
  private fileService = inject(FileService);
  private router = inject(Router);
  private native = inject(NativeService);

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  readonly types = signal<ClaimType[]>([]);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly receiptPreview = signal<string | null>(null);
  readonly receiptKind = signal<'image' | 'pdf' | null>(null);
  readonly receiptName = signal<string | null>(null);
  private receiptFile: File | null = null;

  readonly form = this.fb.group({
    claim_type_id: [0, [Validators.required, Validators.min(1)]],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit(): void {
    this.claimService.getAllClaimTypes().subscribe({
      next: (res) => this.types.set(res.data || []),
    });
  }

  selectType(id: number): void {
    this.native.hapticLight();
    this.form.patchValue({ claim_type_id: id });
  }

  async captureReceipt(): Promise<void> {
    this.native.hapticLight();
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Receipt',
        promptLabelPhoto: 'Choose from gallery',
        promptLabelPicture: 'Take photo',
      });

      if (!photo.dataUrl) return;
      this.receiptPreview.set(photo.dataUrl);
      this.receiptKind.set('image');

      const blob = await (await fetch(photo.dataUrl)).blob();
      const filename = `receipt-${Date.now()}.${photo.format || 'jpg'}`;
      this.receiptFile = new File([blob], filename, {
        type: blob.type || 'image/jpeg',
      });
      this.receiptName.set(filename);
    } catch {
      // user cancelled, ignore
    }
  }

  pickFile(): void {
    this.native.hapticLight();
    this.fileInputRef?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.receiptFile = file;
    this.receiptName.set(file.name);

    if (file.type === 'application/pdf') {
      this.receiptKind.set('pdf');
      this.receiptPreview.set('pdf');
    } else if (file.type.startsWith('image/')) {
      this.receiptKind.set('image');
      const reader = new FileReader();
      reader.onload = () => this.receiptPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.error.set('Only image or PDF files are allowed.');
      this.receiptFile = null;
      this.receiptName.set(null);
    }

    input.value = '';
  }

  clearReceipt(): void {
    this.receiptPreview.set(null);
    this.receiptKind.set(null);
    this.receiptName.set(null);
    this.receiptFile = null;
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    const eid = this.auth.currentUserSignal()?.employee?.public_id;
    if (!eid) {
      this.error.set('Employee profile not found.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.native.hapticMedium();

    const v = this.form.value;
    const basePayload = {
      employee_id: eid,
      claim_type_id: v.claim_type_id!,
      date: v.date!,
      amount: Number(v.amount),
      description: v.description!,
    };

    const afterUpload = (receiptUrl?: string) => {
      this.claimService
        .submitClaim({ ...basePayload, ...(receiptUrl && { receipt_url: receiptUrl }) })
        .subscribe({
          next: () => {
            this.submitting.set(false);
            void this.router.navigateByUrl('/m/claims');
          },
          error: (err) => {
            this.submitting.set(false);
            this.error.set(err?.message || 'Failed to submit claim.');
          },
        });
    };

    if (this.receiptFile) {
      this.fileService
        .uploadFiles([this.receiptFile], { category: 'claim_receipt', is_public: false })
        .subscribe({
          next: (res: any) => {
            const url = res?.data?.files?.[0]?.file_path || res?.data?.[0]?.file_path;
            afterUpload(url);
          },
          error: () => afterUpload(),
        });
    } else {
      afterUpload();
    }
  }
}
