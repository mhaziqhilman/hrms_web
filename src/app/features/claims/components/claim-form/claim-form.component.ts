import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ClaimService } from '../../services/claim.service';
import { ClaimType, Claim } from '../../models/claim.model';
import { FileUpload } from '../../../../shared/components/file-upload/file-upload';
import { FileList as FileListComponent } from '../../../../shared/components/file-list/file-list';
import { FileService, FileUploadMetadata } from '../../../../core/services/file.service';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

@Component({
  selector: 'app-claim-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    FileUpload,
    FileListComponent,
    ZardCardComponent,
    ZardIconComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
    ZardDatePickerComponent
  ],
  templateUrl: './claim-form.component.html',
  styleUrl: './claim-form.component.css'
})
export class ClaimFormComponent implements OnInit {
  claimForm!: FormGroup;
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Edit mode
  isEditMode = signal(false);
  claimId = signal<number | null>(null);
  existingClaim = signal<Claim | null>(null);

  // Claim Types
  claimTypes = signal<ClaimType[]>([]);
  loadingClaimTypes = signal(false);
  selectedClaimType = signal<ClaimType | null>(null);

  // Employee (mock for now - should come from auth service)
  employeeId = signal<number | null>(1); // TODO: Get from auth service
  employeeName = signal<string>('Current Employee'); // TODO: Get from auth service

  // File upload
  uploadedFiles = signal<File[]>([]);
  receiptFiles = signal<File[]>([]);
  fileUploadMetadata = signal<FileUploadMetadata | undefined>(undefined);
  canEditClaim = signal(true); // Can edit if status is Pending

  constructor(
    private fb: FormBuilder,
    private claimService: ClaimService,
    private fileService: FileService,
    private router: Router,
    private route: ActivatedRoute,
    private alertDialogService: ZardAlertDialogService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadClaimTypes();
    this.checkEditMode();
    this.initializeFileUploadMetadata();
  }

  initializeFileUploadMetadata(): void {
    // For new claims, prepare metadata without claim ID (will be set after submission)
    this.fileUploadMetadata.set({
      category: 'claim_receipt',
      sub_category: 'receipt',
      description: 'Receipt files for claim'
    });
  }

  initializeForm(): void {
    this.claimForm = this.fb.group({
      claim_type_id: ['', [Validators.required]],
      date: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      receipt_url: ['']
    });

    // Watch for claim type changes to update selected type
    this.claimForm.get('claim_type_id')?.valueChanges.subscribe(typeId => {
      if (typeId) {
        const claimType = this.claimTypes().find(ct => ct.id === parseInt(typeId));
        this.selectedClaimType.set(claimType || null);
      } else {
        this.selectedClaimType.set(null);
      }
    });
  }

  loadClaimTypes(): void {
    this.loadingClaimTypes.set(true);
    this.claimService.getAllClaimTypes().subscribe({
      next: (response) => {
        if (response.success) {
          // Filter only active claim types
          const activeTypes = response.data.filter(ct => ct.is_active !== false);
          this.claimTypes.set(activeTypes);
        }
        this.loadingClaimTypes.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load claim types');
        this.loadingClaimTypes.set(false);
        console.error('Error loading claim types:', err);
      }
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.claimId.set(parseInt(id));
      this.loadExistingClaim(parseInt(id));
    }
  }

  loadExistingClaim(id: number): void {
    this.loading.set(true);
    this.claimService.getClaimById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const claim = response.data;
          this.existingClaim.set(claim);

          // Check if claim can be edited (only Pending status)
          if (claim.status !== 'Pending') {
            this.canEditClaim.set(false);
            this.error.set('Only pending claims can be edited');
            // Allow viewing but disable form
            this.claimForm.disable();
          } else {
            this.canEditClaim.set(true);
          }

          // Populate form
          this.claimForm.patchValue({
            claim_type_id: claim.claim_type_id,
            date: claim.date,
            amount: claim.amount,
            description: claim.description,
            receipt_url: claim.receipt_url || ''
          });

          // Prepare file upload metadata for existing claim
          this.prepareFileUploadMetadata();
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load claim details');
        this.loading.set(false);
        console.error('Error loading claim:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.claimForm.invalid) {
      this.markFormGroupTouched(this.claimForm);
      this.alertDialogService.warning({
        zTitle: 'Invalid Form',
        zDescription: 'Please fill in all required fields correctly before submitting.',
        zOkText: 'OK'
      });
      return;
    }

    if (!this.employeeId() && !this.isEditMode()) {
      this.alertDialogService.warning({
        zTitle: 'Authentication Error',
        zDescription: 'Employee ID not found. Please log in again.',
        zOkText: 'OK'
      });
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    const formData = this.claimForm.value;

    if (this.isEditMode() && this.claimId()) {
      // Update existing claim
      const updateData = {
        claim_type_id: parseInt(formData.claim_type_id),
        date: formData.date,
        amount: parseFloat(formData.amount),
        description: formData.description,
        receipt_url: formData.receipt_url || undefined
      };

      this.claimService.updateClaim(this.claimId()!, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.submitting.set(false);
            this.alertDialogService.info({
              zTitle: 'Success',
              zDescription: 'Claim updated successfully! You will be redirected to the claims list.',
              zOkText: 'OK',
              zOnOk: () => {
                this.router.navigate(['/claims']);
              }
            });
          } else {
            this.submitting.set(false);
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.alertDialogService.warning({
            zTitle: 'Update Failed',
            zDescription: err.error?.message || 'Failed to update claim. Please try again.',
            zOkText: 'OK'
          });
          console.error('Update claim error:', err);
        }
      });
    } else {
      // Submit new claim
      const request = {
        employee_id: this.employeeId()!,
        claim_type_id: parseInt(formData.claim_type_id),
        date: formData.date,
        amount: parseFloat(formData.amount),
        description: formData.description,
        receipt_url: formData.receipt_url || undefined
      };

      this.claimService.submitClaim(request).subscribe({
        next: (response) => {
          if (response.success) {
            const newClaimId = response.data?.id;

            // Upload files if any were selected
            if (newClaimId && this.receiptFiles().length > 0) {
              this.uploadFilesForClaim(newClaimId);
            } else {
              this.submitting.set(false);
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Claim submitted successfully! You will be redirected to the claims list.',
                zOkText: 'OK',
                zOnOk: () => {
                  this.claimForm.reset();
                  this.router.navigate(['/claims']);
                }
              });
            }
          } else {
            this.submitting.set(false);
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.alertDialogService.warning({
            zTitle: 'Submission Failed',
            zDescription: err.error?.message || 'Failed to submit claim. Please try again.',
            zOkText: 'OK'
          });
          console.error('Submit claim error:', err);
        }
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.claimForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.claimForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} must be greater than 0`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      claim_type_id: 'Claim type',
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      receipt_url: 'Receipt URL'
    };
    return labels[fieldName] || fieldName;
  }

  getMaxDate(): string {
    // Cannot claim for future dates
    return new Date().toISOString().split('T')[0];
  }

  getMinDate(): string {
    // Can claim up to 90 days in the past
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 90);
    return minDate.toISOString().split('T')[0];
  }

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RM 0.00';
    }
    return `RM ${numAmount.toFixed(2)}`;
  }

  isAmountExceedingLimit(): boolean {
    const amount = this.claimForm.get('amount')?.value;
    const maxAmount = this.selectedClaimType()?.max_amount;

    if (!amount || !maxAmount) return false;

    const numAmount = parseFloat(amount);
    const numMaxAmount = typeof maxAmount === 'string' ? parseFloat(maxAmount) : maxAmount;

    return numAmount > numMaxAmount;
  }

  isReceiptRequired(): boolean {
    return this.selectedClaimType()?.requires_receipt === true;
  }

  onFilesSelected(files: File[]): void {
    this.receiptFiles.set(files);
  }

  onFileUploadComplete(response: any): void {
    console.log('Files uploaded successfully:', response);
    this.success.set('Claim and receipts uploaded successfully!');
    setTimeout(() => {
      this.router.navigate(['/claims']);
    }, 1500);
  }

  onFileUploadError(error: any): void {
    this.error.set(error.error?.message || 'File upload failed');
    this.submitting.set(false);
  }

  prepareFileUploadMetadata(): void {
    if (this.claimId()) {
      this.fileUploadMetadata.set({
        category: 'claim_receipt',
        sub_category: 'receipt',
        related_to_claim_id: this.claimId()!,
        description: `Receipts for claim #${this.claimId()}`
      });
    }
  }

  uploadFilesForClaim(claimId: number): void {
    const metadata: FileUploadMetadata = {
      category: 'claim_receipt',
      sub_category: 'receipt',
      related_to_claim_id: claimId,
      description: `Receipts for claim #${claimId}`
    };

    this.fileService.uploadFiles(this.receiptFiles(), metadata).subscribe({
      next: (response) => {
        console.log('Files uploaded successfully:', response);
        this.submitting.set(false);
        this.alertDialogService.info({
          zTitle: 'Success',
          zDescription: 'Claim and receipts submitted successfully! You will be redirected to the claims list.',
          zOkText: 'OK',
          zOnOk: () => {
            this.claimForm.reset();
            this.receiptFiles.set([]);
            this.router.navigate(['/claims']);
          }
        });
      },
      error: (error) => {
        this.submitting.set(false);
        this.alertDialogService.warning({
          zTitle: 'Upload Failed',
          zDescription: error.error?.message || 'Failed to upload receipt files. Please try again.',
          zOkText: 'OK'
        });
      }
    });
  }

  isClaimEditable(): boolean {
    return this.canEditClaim();
  }
}
