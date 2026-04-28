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
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardFormControlComponent } from '@/shared/components/form/form-control.component';
import { ZardFormMessageComponent } from '@/shared/components/form/form-message.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

import { FileUpload } from '@/shared/components/file-upload/file-upload';
import { FileService, FileUploadMetadata } from '@/core/services/file.service';
import { AuthService } from '@/core/services/auth.service';

import { LeaveService } from '../../services/leave.service';
import { Leave, LeaveType } from '../../models/leave.model';
import { EmployeeService } from '../../../employees/services/employee.service';
import { Employee } from '../../../employees/models/employee.model';

@Component({
  selector: 'app-leave-form-sheet',
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
    ZardCheckboxComponent,
    ZardDividerComponent,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardFormControlComponent,
    ZardFormMessageComponent,
    FileUpload
  ],
  templateUrl: './leave-form-sheet.component.html',
  styleUrl: './leave-form-sheet.component.css'
})
export class LeaveFormSheetComponent implements OnChanges {
  @Input() open = false;
  @Input() leaveId: string | null = null;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private leaveService = inject(LeaveService);
  private employeeService = inject(EmployeeService);
  private fileService = inject(FileService);
  private authService = inject(AuthService);
  private alertDialogService = inject(ZardAlertDialogService);

  leaveForm: FormGroup;
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  employees = signal<Employee[]>([]);
  leaveTypes = signal<LeaveType[]>([]);
  leaveBalance = signal<any>(null);

  isEditMode = signal(false);
  isStaff = signal(false);

  mcFiles = signal<File[]>([]);
  fileUploadMetadata: FileUploadMetadata = {
    category: 'leave_document',
    sub_category: 'medical_certificate',
    description: 'Medical certificate for leave'
  };

  constructor() {
    this.leaveForm = this.fb.group({
      employee_id: [null, Validators.required],
      leave_type_id: [null, Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      is_half_day: [false],
      half_day_period: ['AM'],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      attachment_url: ['']
    });

    this.leaveForm.get('leave_type_id')?.valueChanges.subscribe(() => {
      this.updateFileMetadataSubCategory();
    });

    this.leaveForm.get('is_half_day')?.valueChanges.subscribe((isHalf) => {
      if (isHalf) {
        const start = this.leaveForm.get('start_date')?.value;
        if (start) {
          this.leaveForm.patchValue({ end_date: start }, { emitEvent: false });
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.initializeSheet();
    }
  }

  private initializeSheet(): void {
    const currentUser = this.authService.getCurrentUserValue();
    this.isStaff.set(currentUser?.role === 'staff');

    // Reset form
    this.leaveForm.reset({
      employee_id: null,
      leave_type_id: null,
      start_date: '',
      end_date: '',
      is_half_day: false,
      half_day_period: 'AM',
      reason: '',
      attachment_url: ''
    });
    this.error.set(null);
    this.mcFiles.set([]);
    this.leaveBalance.set(null);

    // Load leave types
    this.loadLeaveTypes();

    if (this.isStaff()) {
      const employeeId = currentUser?.employee?.public_id;
      if (employeeId) {
        this.leaveForm.patchValue({ employee_id: employeeId });
        this.loadLeaveBalance(employeeId);
      }
    } else {
      this.loadEmployees();
    }

    // Edit mode
    if (this.leaveId) {
      this.isEditMode.set(true);
      this.loadLeaveData(this.leaveId);
    } else {
      this.isEditMode.set(false);
    }
  }

  private loadLeaveTypes(): void {
    this.leaveService.getLeaveTypes().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.leaveTypes.set(res.data);
        }
      }
    });
  }

  private loadEmployees(): void {
    this.employeeService.getEmployees({ status: 'Active', limit: 100 }).subscribe({
      next: (res) => {
        if (res.success) {
          this.employees.set(res.data.employees);
        }
      }
    });
  }

  private loadLeaveBalance(employeeId: number | string): void {
    const year = new Date().getFullYear();
    this.leaveService.getLeaveBalance(employeeId, year).subscribe({
      next: (res) => {
        if (res.success) {
          this.leaveBalance.set(res.data);
        }
      }
    });
  }

  private loadLeaveData(id: string): void {
    this.loading.set(true);
    this.leaveService.getLeaveById(id).subscribe({
      next: (res) => {
        if (res.success) {
          const leave = res.data;
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
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load leave data');
        this.loading.set(false);
      }
    });
  }

  onEmployeeChange(employeeId: any): void {
    if (employeeId) {
      this.loadLeaveBalance(employeeId);
    }
  }

  onFilesSelected(files: File[]): void {
    this.mcFiles.set(files);
  }

  getSelectedLeaveType(): LeaveType | undefined {
    const typeId = this.leaveForm.get('leave_type_id')?.value;
    return this.leaveTypes().find(t => t.id === Number(typeId));
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

  calculateTotalDays(): number {
    const startDate = this.leaveForm.get('start_date')?.value;
    const endDate = this.leaveForm.get('end_date')?.value;
    const isHalfDay = this.leaveForm.get('is_half_day')?.value;

    if (!startDate || !endDate) return 0;
    if (isHalfDay) return 0.5;

    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  requiresDocument(): boolean {
    const selected = this.getSelectedLeaveType();
    if (!selected) return false;
    return selected.requires_document === true;
  }

  getDocumentTitle(): string {
    const selected = this.getSelectedLeaveType();
    if (!selected) return 'Supporting Document';
    switch (selected.name) {
      case 'Medical Leave':
      case 'Hospitalization Leave':
        return 'Medical Certificate';
      case 'Emergency Leave':
      case 'Paternity Leave':
      case 'Maternity Leave':
        return 'Proof/Justification Document';
      case 'Compassionate Leave':
        return 'Confirmation Letter';
      default:
        return 'Supporting Document';
    }
  }

  getAcceptedFileTypes(): string {
    const selected = this.getSelectedLeaveType();
    if (!selected) return '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    if (selected.name === 'Medical Leave' || selected.name === 'Hospitalization Leave') {
      return '.pdf,.jpg,.jpeg,.png';
    }
    return '.pdf,.jpg,.jpeg,.png,.doc,.docx';
  }

  private updateFileMetadataSubCategory(): void {
    const selected = this.getSelectedLeaveType();
    if (!selected) return;
    let subCategory = 'general';
    let description = 'Supporting document for leave';
    switch (selected.name) {
      case 'Medical Leave':
      case 'Hospitalization Leave':
        subCategory = 'medical_certificate';
        description = 'Medical certificate for leave';
        break;
      case 'Emergency Leave':
        subCategory = 'emergency_proof';
        description = 'Emergency leave proof';
        break;
      case 'Paternity Leave':
        subCategory = 'paternity_proof';
        description = 'Paternity leave proof';
        break;
      case 'Maternity Leave':
        subCategory = 'maternity_proof';
        description = 'Maternity leave proof';
        break;
      case 'Compassionate Leave':
        subCategory = 'confirmation_letter';
        description = 'Compassionate leave confirmation';
        break;
    }
    this.fileUploadMetadata = {
      ...this.fileUploadMetadata,
      sub_category: subCategory,
      description
    };
  }

  getControl(name: string) {
    return this.leaveForm.get(name);
  }

  markAllTouched(): void {
    Object.keys(this.leaveForm.controls).forEach(k => this.leaveForm.get(k)?.markAsTouched());
  }

  onSubmit(): void {
    if (this.leaveForm.invalid) {
      this.markAllTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    const formData = this.leaveForm.value;

    if (this.isEditMode() && this.leaveId) {
      const updateData: any = {
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_half_day: formData.is_half_day,
        half_day_period: formData.half_day_period,
        reason: formData.reason
      };
      if (formData.attachment_url) {
        updateData.attachment_url = formData.attachment_url;
      }
      this.leaveService.updateLeave(this.leaveId, updateData).subscribe({
        next: (res) => {
          if (res.success) {
            this.alertDialogService.info({
              zTitle: 'Success',
              zDescription: 'Leave application updated successfully',
              zOkText: 'OK'
            });
            this.saved.emit();
            this.close();
          }
          this.submitting.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to update leave');
          this.submitting.set(false);
        }
      });
    } else {
      const applyData: any = { ...formData };
      if (!applyData.attachment_url) delete applyData.attachment_url;

      this.leaveService.applyLeave(applyData).subscribe({
        next: (res) => {
          if (res.success) {
            const newLeaveId = res.data?.id;
            if (newLeaveId && this.mcFiles().length > 0) {
              this.uploadFiles(newLeaveId);
            } else {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Leave application submitted successfully',
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
          this.error.set(err.error?.message || 'Failed to apply for leave');
          this.submitting.set(false);
        }
      });
    }
  }

  private uploadFiles(leaveId: number): void {
    const metadata: FileUploadMetadata = {
      ...this.fileUploadMetadata,
      related_to_leave_id: leaveId
    };
    this.fileService.uploadFiles(this.mcFiles(), metadata).subscribe({
      next: () => {
        this.alertDialogService.info({
          zTitle: 'Success',
          zDescription: 'Leave application and documents submitted successfully',
          zOkText: 'OK'
        });
        this.saved.emit();
        this.close();
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'File upload failed');
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
