import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { LeaveService } from '../../services/leave.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { Leave, LeaveType, DEFAULT_LEAVE_TYPES } from '../../models/leave.model';
import { Employee } from '../../../employees/models/employee.model';
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

@Component({
  selector: 'app-leave-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    FileUpload,
    FileListComponent,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
    ZardDatePickerComponent
  ],
  templateUrl: './leave-form.component.html',
  styleUrl: './leave-form.component.css'
})
export class LeaveFormComponent implements OnInit {
  leaveForm!: FormGroup;
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  employees = signal<Employee[]>([]);
  loadingEmployees = signal(false);

  leaveTypes = signal<LeaveType[]>([]);
  leaveBalance = signal<any>(null);

  isEditMode = signal(false);
  leaveId = signal<number | null>(null);

  // Attachment mode toggle
  showUrlInput = signal(false);

  // File upload
  mcFiles = signal<File[]>([]);
  fileUploadMetadata: FileUploadMetadata = {
    category: 'leave_document',
    sub_category: 'medical_certificate',
    description: 'Medical certificate for leave'
  };

  // Constants
  DEFAULT_LEAVE_TYPES = DEFAULT_LEAVE_TYPES;

  constructor(
    private fb: FormBuilder,
    private leaveService: LeaveService,
    private employeeService: EmployeeService,
    private fileService: FileService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadEmployees();
    this.initializeLeaveTypes();
    this.initializeFileUploadMetadata();

    // Check if edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.leaveId.set(Number(id));
      this.loadLeaveData(Number(id));
    }

    // Subscribe to form value changes
    this.leaveForm.valueChanges.subscribe(() => {
      this.calculateTotalDays();
    });
  }

  initializeFileUploadMetadata(): void {
    // For new leaves, prepare metadata without leave ID (will be set after submission)
    this.fileUploadMetadata = {
      category: 'leave_document',
      sub_category: 'medical_certificate',
      description: 'Medical certificate for leave'
    };
  }

  initializeForm(): void {
    this.leaveForm = this.fb.group({
      employee_id: [null, Validators.required],
      leave_type_id: [null, Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      is_half_day: [false],
      half_day_period: ['AM'],
      reason: ['', Validators.required],
      attachment_url: ['']
    });

    // Watch for leave type changes to update file metadata
    this.leaveForm.get('leave_type_id')?.valueChanges.subscribe(typeId => {
      if (typeId) {
        this.updateFileMetadataSubCategory();
      }
    });
  }

  initializeLeaveTypes(): void {
    // Create mock leave types based on DEFAULT_LEAVE_TYPES
    const mockLeaveTypes: LeaveType[] = DEFAULT_LEAVE_TYPES.map((name, index) => ({
      id: index + 1,
      name: name,
      days_per_year: name === 'Annual Leave' ? 14 : name === 'Medical Leave' ? 14 : 0,
      is_paid: !name.includes('Unpaid'),
      carry_forward_allowed: name === 'Annual Leave',
      carry_forward_max_days: name === 'Annual Leave' ? 7 : 0,
      prorate_for_new_joiners: true,
      requires_document: name.includes('Medical') || name.includes('Hospitalization'),
      description: `${name} entitlement`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    this.leaveTypes.set(mockLeaveTypes);
  }

  loadEmployees(): void {
    this.loadingEmployees.set(true);

    this.employeeService.getEmployees({ status: 'Active', limit: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.employees.set(response.data.employees);
        }
        this.loadingEmployees.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load employees');
        this.loadingEmployees.set(false);
        console.error('Error loading employees:', err);
      }
    });
  }

  loadLeaveData(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.leaveService.getLeaveById(id).subscribe({
      next: (response) => {
        if (response.success) {
          const leave = response.data;

          // Format dates to YYYY-MM-DD for input
          const startDate = leave.start_date ? new Date(leave.start_date).toISOString().split('T')[0] : '';
          const endDate = leave.end_date ? new Date(leave.end_date).toISOString().split('T')[0] : '';

          this.leaveForm.patchValue({
            employee_id: leave.employee_id,
            leave_type_id: leave.leave_type_id,
            start_date: startDate,
            end_date: endDate,
            is_half_day: leave.is_half_day,
            half_day_period: leave.half_day_period || 'AM',
            reason: leave.reason,
            attachment_url: leave.attachment_url || ''
          });

          // Prepare file upload metadata for existing leave
          this.prepareFileUploadMetadata();
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load leave data');
        this.loading.set(false);
        console.error('Error loading leave:', err);
      }
    });
  }

  prepareFileUploadMetadata(): void {
    if (this.leaveId()) {
      this.fileUploadMetadata = {
        category: 'leave_document',
        sub_category: 'medical_certificate',
        related_to_leave_id: this.leaveId()!,
        description: `Medical certificate for leave #${this.leaveId()}`
      };
    }
  }

  onEmployeeChange(employeeId: any): void {
    if (employeeId) {
      this.loadLeaveBalance(Number(employeeId));
    }
  }

  loadLeaveBalance(employeeId: number): void {
    const currentYear = new Date().getFullYear();

    this.leaveService.getLeaveBalance(employeeId, currentYear).subscribe({
      next: (response) => {
        if (response.success) {
          this.leaveBalance.set(response.data);
        }
      },
      error: (err) => {
        console.error('Error loading leave balance:', err);
      }
    });
  }

  onHalfDayChange(): void {
    const isHalfDay = this.leaveForm.get('is_half_day')?.value;

    if (isHalfDay) {
      // Set end date same as start date for half-day leave
      const startDate = this.leaveForm.get('start_date')?.value;
      if (startDate) {
        this.leaveForm.patchValue({
          end_date: startDate
        });
      }
    }
  }

  calculateTotalDays(): void {
    const startDate = this.leaveForm.get('start_date')?.value;
    const endDate = this.leaveForm.get('end_date')?.value;
    const isHalfDay = this.leaveForm.get('is_half_day')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isHalfDay) {
        return; // 0.5 day is handled by backend
      }

      // Calculate business days (excluding weekends)
      let days = 0;
      const current = new Date(start);

      while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
          days++;
        }
        current.setDate(current.getDate() + 1);
      }
    }
  }

  getAvailableBalance(): number {
    const leaveTypeId = this.leaveForm.get('leave_type_id')?.value;
    const balance = this.leaveBalance();

    if (!balance || !leaveTypeId) return 0;

    const entitlement = balance.entitlements?.find(
      (e: any) => e.leave_type.id === Number(leaveTypeId)
    );

    return entitlement ? entitlement.balance_days : 0;
  }

  onSubmit(): void {
    if (this.leaveForm.invalid) {
      this.markFormGroupTouched(this.leaveForm);
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formData = this.leaveForm.value;

    if (this.isEditMode() && this.leaveId()) {
      // Update existing leave
      const updateData: any = {
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_half_day: formData.is_half_day,
        half_day_period: formData.half_day_period,
        reason: formData.reason
      };

      // Only include attachment_url if it's not empty
      if (formData.attachment_url) {
        updateData.attachment_url = formData.attachment_url;
      }

      this.leaveService.updateLeave(this.leaveId()!, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Leave application updated successfully');
            this.router.navigate(['/dashboard/leave']);
          }
          this.submitting.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to update leave application');
          this.submitting.set(false);
          console.error('Error updating leave:', err);
        }
      });
    } else {
      // Apply new leave
      // Remove empty attachment_url to avoid validation error
      const applyData = { ...formData };
      if (!applyData.attachment_url) {
        delete applyData.attachment_url;
      }

      this.leaveService.applyLeave(applyData).subscribe({
        next: (response) => {
          if (response.success) {
            const newLeaveId = response.data?.id;

            // Upload files if any were selected
            if (newLeaveId && this.mcFiles().length > 0) {
              this.uploadFilesForLeave(newLeaveId);
            } else {
              alert('Leave application submitted successfully');
              this.router.navigate(['/dashboard/leave']);
              this.submitting.set(false);
            }
          } else {
            this.submitting.set(false);
          }
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to apply for leave');
          this.submitting.set(false);
          console.error('Error applying leave:', err);
        }
      });
    }
  }

  onFilesSelected(files: File[]): void {
    this.mcFiles.set(files);
  }

  onFileUploadComplete(response: any): void {
    console.log('Files uploaded successfully:', response);
    const documentType = this.getDocumentTitle().replace(' Upload', '').toLowerCase();
    alert(`Leave application and ${documentType} uploaded successfully`);
    this.router.navigate(['/dashboard/leave']);
  }

  onFileUploadError(error: any): void {
    this.error.set(error.error?.message || 'File upload failed');
    this.submitting.set(false);
  }

  uploadFilesForLeave(leaveId: number): void {
    const metadata: FileUploadMetadata = {
      category: 'leave_document',
      sub_category: 'medical_certificate',
      related_to_leave_id: leaveId,
      description: `Medical certificate for leave #${leaveId}`
    };

    this.fileService.uploadFiles(this.mcFiles(), metadata).subscribe({
      next: (response) => {
        console.log('Files uploaded successfully:', response);
        const documentType = this.getDocumentTitle().replace(' Upload', '').toLowerCase();
        alert(`Leave application and ${documentType} submitted successfully`);
        this.mcFiles.set([]);
        this.router.navigate(['/dashboard/leave']);
        this.submitting.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Failed to upload medical certificate');
        this.submitting.set(false);
      }
    });
  }

  isMedicalLeave(): boolean {
    const leaveTypeId = this.leaveForm.get('leave_type_id')?.value;
    const selectedType = this.leaveTypes().find(t => t.id === Number(leaveTypeId));
    return selectedType?.requires_document === true;
  }

  requiresDocument(): boolean {
    const leaveTypeId = this.leaveForm.get('leave_type_id')?.value;
    if (!leaveTypeId) return false;

    const selectedType = this.leaveTypes().find(t => t.id === Number(leaveTypeId));
    if (!selectedType) return false;

    // Annual Leave and Unpaid Leave don't require documents
    const noDocumentTypes = ['Annual Leave', 'Unpaid Leave'];
    return !noDocumentTypes.includes(selectedType.name);
  }

  getDocumentTitle(): string {
    const leaveTypeId = this.leaveForm.get('leave_type_id')?.value;
    if (!leaveTypeId) return 'Document Upload';

    const selectedType = this.leaveTypes().find(t => t.id === Number(leaveTypeId));
    if (!selectedType) return 'Document Upload';

    switch (selectedType.name) {
      case 'Medical Leave':
      case 'Hospitalization Leave':
        return 'Medical Certificate Upload';
      case 'Emergency Leave':
      case 'Paternity Leave':
      case 'Maternity Leave':
        return 'Proof/Justification Document Upload';
      case 'Compassionate Leave':
        return 'Confirmation Letter Upload';
      default:
        return 'Supporting Document Upload';
    }
  }

  getDocumentDescription(): string {
    const leaveTypeId = this.leaveForm.get('leave_type_id')?.value;
    if (!leaveTypeId) return 'Upload supporting documents here.';

    const selectedType = this.leaveTypes().find(t => t.id === Number(leaveTypeId));
    if (!selectedType) return 'Upload supporting documents here.';

    switch (selectedType.name) {
      case 'Medical Leave':
      case 'Hospitalization Leave':
        return 'Upload your medical certificate (MC) here. Accepted formats: PDF, JPG, PNG';
      case 'Emergency Leave':
        return 'Upload proof or justification document for emergency leave. Accepted formats: PDF, JPG, PNG, DOC, DOCX';
      case 'Paternity Leave':
        return 'Upload proof document (birth certificate, hospital letter, etc.). Accepted formats: PDF, JPG, PNG, DOC, DOCX';
      case 'Maternity Leave':
        return 'Upload proof document (medical certificate, hospital letter, etc.). Accepted formats: PDF, JPG, PNG, DOC, DOCX';
      case 'Compassionate Leave':
        return 'Upload confirmation letter or supporting document. Accepted formats: PDF, JPG, PNG, DOC, DOCX';
      default:
        return 'Upload supporting documents here. Accepted formats: PDF, JPG, PNG, DOC, DOCX';
    }
  }

  getAcceptedFileTypes(): string {
    const leaveTypeId = this.leaveForm.get('leave_type_id')?.value;
    if (!leaveTypeId) return '.pdf,.jpg,.jpeg,.png,.doc,.docx';

    const selectedType = this.leaveTypes().find(t => t.id === Number(leaveTypeId));
    if (!selectedType) return '.pdf,.jpg,.jpeg,.png,.doc,.docx';

    // Medical leave typically only needs images/PDFs
    if (selectedType.name === 'Medical Leave' || selectedType.name === 'Hospitalization Leave') {
      return '.pdf,.jpg,.jpeg,.png';
    }

    // Other leave types can accept more document types
    return '.pdf,.jpg,.jpeg,.png,.doc,.docx';
  }

  updateFileMetadataSubCategory(): void {
    const leaveTypeId = this.leaveForm.get('leave_type_id')?.value;
    if (!leaveTypeId) return;

    const selectedType = this.leaveTypes().find(t => t.id === Number(leaveTypeId));
    if (!selectedType) return;

    let subCategory = 'general';
    let description = 'Document for leave';

    switch (selectedType.name) {
      case 'Medical Leave':
      case 'Hospitalization Leave':
        subCategory = 'medical_certificate';
        description = 'Medical certificate for leave';
        break;
      case 'Emergency Leave':
        subCategory = 'emergency_proof';
        description = 'Emergency leave justification document';
        break;
      case 'Paternity Leave':
        subCategory = 'paternity_proof';
        description = 'Paternity leave proof document';
        break;
      case 'Maternity Leave':
        subCategory = 'maternity_proof';
        description = 'Maternity leave proof document';
        break;
      case 'Compassionate Leave':
        subCategory = 'confirmation_letter';
        description = 'Compassionate leave confirmation letter';
        break;
      default:
        subCategory = 'general';
        description = 'Supporting document for leave';
        break;
    }

    this.fileUploadMetadata = {
      ...this.fileUploadMetadata,
      sub_category: subCategory,
      description: description
    };
  }

  toggleAttachmentMode(): void {
    this.showUrlInput.set(!this.showUrlInput());
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/dashboard/leave']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.leaveForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.leaveForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
    }
    return '';
  }
}
