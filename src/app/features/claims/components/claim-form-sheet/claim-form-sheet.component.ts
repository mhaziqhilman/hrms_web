import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ZardSheetImports } from '@/shared/components/sheet/sheet.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardFormControlComponent } from '@/shared/components/form/form-control.component';
import { ZardFormMessageComponent } from '@/shared/components/form/form-message.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

import { FileUpload } from '@/shared/components/file-upload/file-upload';
import { FileService, FileUploadMetadata } from '@/core/services/file.service';
import { AuthService } from '@/core/services/auth.service';
import { DisplayService } from '@/core/services/display.service';

import { ClaimService } from '../../services/claim.service';
import { Claim, ClaimType } from '../../models/claim.model';

@Component({
  selector: 'app-claim-form-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardSheetImports,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
    ZardDatePickerComponent,
    ZardDividerComponent,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardFormControlComponent,
    ZardFormMessageComponent,
    FileUpload
  ],
  templateUrl: './claim-form-sheet.component.html',
  styleUrl: './claim-form-sheet.component.css'
})
export class ClaimFormSheetComponent implements OnChanges {
  @Input() open = false;
  @Input() claimId: string | null = null;
  @Input() viewOnly = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private claimService = inject(ClaimService);
  private fileService = inject(FileService);
  private authService = inject(AuthService);
  private alertDialogService = inject(ZardAlertDialogService);
  private displayService = inject(DisplayService);

  claimForm: FormGroup;
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  claimTypes = signal<ClaimType[]>([]);
  selectedClaimType = signal<ClaimType | null>(null);

  isEditMode = signal(false);
  isReadOnly = signal(false);
  existingClaim = signal<Claim | null>(null);

  receiptFiles = signal<File[]>([]);
  fileUploadMetadata: FileUploadMetadata = {
    category: 'claim_receipt',
    sub_category: 'receipt',
    description: 'Receipt for claim'
  };

  constructor() {
    this.claimForm = this.fb.group({
      claim_type_id: ['', Validators.required],
      date: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      receipt_url: ['']
    });

    this.claimForm.get('claim_type_id')?.valueChanges.subscribe((typeId) => {
      if (typeId) {
        const type = this.claimTypes().find(ct => ct.id === Number(typeId));
        this.selectedClaimType.set(type || null);
      } else {
        this.selectedClaimType.set(null);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.initializeSheet();
    }
  }

  private initializeSheet(): void {
    this.error.set(null);
    this.receiptFiles.set([]);
    this.existingClaim.set(null);
    this.claimForm.reset({
      claim_type_id: '',
      date: '',
      amount: '',
      description: '',
      receipt_url: ''
    });
    this.claimForm.enable();
    this.isReadOnly.set(false);

    this.loadClaimTypes();

    if (this.claimId) {
      this.isEditMode.set(true);
      this.loadExistingClaim(this.claimId);
    } else {
      this.isEditMode.set(false);
    }
  }

  private loadClaimTypes(): void {
    this.claimService.getAllClaimTypes().subscribe({
      next: (res) => {
        if (res.success) {
          const activeTypes = res.data.filter(ct => ct.is_active !== false);
          this.claimTypes.set(activeTypes);
          // If edit mode, reload selected type after claim types load
          if (this.isEditMode() && this.existingClaim()) {
            const current = this.claimTypes().find(ct => ct.id === this.existingClaim()!.claim_type_id);
            this.selectedClaimType.set(current || null);
          }
        }
      }
    });
  }

  private loadExistingClaim(id: string): void {
    this.loading.set(true);
    this.claimService.getClaimById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const claim = res.data;
          this.existingClaim.set(claim);
          if (claim.status !== 'Pending' || this.viewOnly) {
            this.isReadOnly.set(true);
            this.claimForm.disable();
          } else {
            this.isReadOnly.set(false);
          }
          this.claimForm.patchValue({
            claim_type_id: claim.claim_type_id,
            date: claim.date,
            amount: claim.amount,
            description: claim.description,
            receipt_url: claim.receipt_url || ''
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load claim');
        this.loading.set(false);
      }
    });
  }

  onFilesSelected(files: File[]): void {
    this.receiptFiles.set(files);
  }

  getControl(name: string) {
    return this.claimForm.get(name);
  }

  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getMinDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split('T')[0];
  }

  formatCurrency(amount: number | string | null | undefined): string {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (n === null || n === undefined || isNaN(n)) return 'RM 0.00';
    return `RM ${n.toFixed(2)}`;
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    return this.displayService.formatDate(date);
  }

  formatDateTime(date: string | null | undefined): string {
    if (!date) return '—';
    return this.displayService.formatDateTime(date);
  }

  setDateShortcut(shortcut: 'today' | 'yesterday' | 'last-week'): void {
    const d = new Date();
    if (shortcut === 'yesterday') d.setDate(d.getDate() - 1);
    if (shortcut === 'last-week') d.setDate(d.getDate() - 7);
    const iso = d.toISOString().split('T')[0];
    this.claimForm.patchValue({ date: iso });
  }

  getAmountUsagePercent(): number | null {
    const amount = this.claimForm.get('amount')?.value;
    const max = this.selectedClaimType()?.max_amount;
    if (!amount || !max) return null;
    const numMax = typeof max === 'string' ? parseFloat(max) : max;
    const numAmount = parseFloat(amount);
    if (!numMax || numMax <= 0) return null;
    return Math.min(100, Math.round((numAmount / numMax) * 100));
  }

  getDescriptionLength(): number {
    return (this.claimForm.get('description')?.value || '').length;
  }

  isAmountExceeding(): boolean {
    const amount = this.claimForm.get('amount')?.value;
    const max = this.selectedClaimType()?.max_amount;
    if (!amount || !max) return false;
    const numMax = typeof max === 'string' ? parseFloat(max) : max;
    return parseFloat(amount) > numMax;
  }

  isReceiptRequired(): boolean {
    return this.selectedClaimType()?.requires_receipt === true;
  }

  markAllTouched(): void {
    Object.keys(this.claimForm.controls).forEach(k => this.claimForm.get(k)?.markAsTouched());
  }

  onSubmit(): void {
    if (this.isReadOnly()) return;
    if (this.claimForm.invalid) {
      this.markAllTouched();
      return;
    }
    if (this.isAmountExceeding()) {
      this.alertDialogService.warning({
        zTitle: 'Amount Exceeds Limit',
        zDescription: `Amount exceeds the maximum allowed (${this.formatCurrency(this.selectedClaimType()?.max_amount)}) for this claim type.`,
        zOkText: 'OK'
      });
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    const formData = this.claimForm.value;

    if (this.isEditMode() && this.claimId) {
      const updateData = {
        claim_type_id: parseInt(formData.claim_type_id),
        date: formData.date,
        amount: parseFloat(formData.amount),
        description: formData.description,
        receipt_url: formData.receipt_url || undefined
      };
      this.claimService.updateClaim(this.claimId, updateData).subscribe({
        next: (res) => {
          if (res.success) {
            this.alertDialogService.info({
              zTitle: 'Success',
              zDescription: 'Claim updated successfully',
              zOkText: 'OK'
            });
            this.saved.emit();
            this.close();
          }
          this.submitting.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to update claim');
          this.submitting.set(false);
        }
      });
    } else {
      const user = this.authService.getCurrentUserValue();
      const employeeId = user?.employee?.id;
      if (!employeeId) {
        this.alertDialogService.warning({
          zTitle: 'Profile Required',
          zDescription: 'Your employee profile must be set up before submitting claims.',
          zOkText: 'OK'
        });
        this.submitting.set(false);
        return;
      }

      const request = {
        employee_id: employeeId,
        claim_type_id: parseInt(formData.claim_type_id),
        date: formData.date,
        amount: parseFloat(formData.amount),
        description: formData.description,
        receipt_url: formData.receipt_url || undefined
      };
      this.claimService.submitClaim(request).subscribe({
        next: (res) => {
          if (res.success) {
            const newClaimId = res.data?.id;
            if (newClaimId && this.receiptFiles().length > 0) {
              this.uploadFiles(newClaimId);
            } else {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Claim submitted successfully',
                zOkText: 'OK'
              });
              this.saved.emit();
              this.close();
              this.submitting.set(false);
            }
          } else {
            this.submitting.set(false);
          }
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to submit claim');
          this.submitting.set(false);
        }
      });
    }
  }

  private uploadFiles(claimId: number): void {
    const metadata: FileUploadMetadata = {
      category: 'claim_receipt',
      sub_category: 'receipt',
      related_to_claim_id: claimId,
      description: `Receipts for claim #${claimId}`
    };
    this.fileService.uploadFiles(this.receiptFiles(), metadata).subscribe({
      next: () => {
        this.alertDialogService.info({
          zTitle: 'Success',
          zDescription: 'Claim and receipts submitted successfully',
          zOkText: 'OK'
        });
        this.saved.emit();
        this.close();
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Upload failed');
        this.submitting.set(false);
      }
    });
  }

  close(): void {
    this.openChange.emit(false);
  }

  handleOpenChange(open: boolean): void {
    this.openChange.emit(open);
  }
}
