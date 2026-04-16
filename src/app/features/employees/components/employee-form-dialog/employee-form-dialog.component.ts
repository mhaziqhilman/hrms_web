import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, switchMap, map, distinctUntilChanged, of, Observable, first } from 'rxjs';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardFormControlComponent } from '@/shared/components/form/form-control.component';
import { ZardFormMessageComponent } from '@/shared/components/form/form-message.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';

import { EmployeeService } from '../../services/employee.service';
import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  Gender,
  MaritalStatus,
  EmploymentType
} from '../../models/employee.model';

interface StepConfig {
  number: number;
  key: string;
  label: string;
  description: string;
  icon: string;
}

export interface EmployeeFormDialogData {
  employee?: Employee;
  onSuccess?: (employee: any) => void;
}

@Component({
  selector: 'app-employee-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardDividerComponent,
    ZardInputDirective,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardFormControlComponent,
    ZardFormMessageComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardDatePickerComponent,
    ZardCheckboxComponent,
    ZardTooltipModule
  ],
  templateUrl: './employee-form-dialog.component.html',
  styleUrls: ['./employee-form-dialog.component.css']
})
export class EmployeeFormDialogComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private dialogRef = inject(ZardDialogRef);
  private dialogData = inject(Z_MODAL_DATA, { optional: true }) as EmployeeFormDialogData | null;
  private fb = inject(FormBuilder);

  // Mode
  isEditMode = false;
  private employeePublicId: string | null = null;

  // Stepper
  currentStep = 1;
  readonly steps: StepConfig[] = [
    { number: 1, key: 'personal', label: 'Personal Info', description: 'Basic identity details', icon: 'user' },
    { number: 2, key: 'contact', label: 'Contact', description: 'Phone, email & address', icon: 'phone' },
    { number: 3, key: 'employment', label: 'Employment', description: 'Role & department', icon: 'briefcase' },
    { number: 4, key: 'compensation', label: 'Compensation', description: 'Salary & banking', icon: 'wallet' },
    { number: 5, key: 'statutory', label: 'Statutory', description: 'Tax & deductions', icon: 'file-text' }
  ];

  // State
  saving = signal(false);
  loading = signal(false);
  checkingEmployeeId = signal(false);

  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  // Form
  employeeForm!: FormGroup;

  // Dropdown options
  genders: Gender[] = ['Male', 'Female'];
  maritalStatuses: MaritalStatus[] = ['Single', 'Married', 'Divorced', 'Widowed'];
  employmentTypes: EmploymentType[] = ['Permanent', 'Contract', 'Probation', 'Intern'];
  taxCategories = [
    { value: 'KA', label: 'KA - Single / Widowed' },
    { value: 'KB', label: 'KB - Married (Spouse not working)' },
    { value: 'KC', label: 'KC - Married (Spouse working)' }
  ];

  // Reporting manager dropdown
  availableManagers = signal<{ id: number; employee_id: string; full_name: string; position?: string }[]>([]);

  // Steps the user has departed from via Next/Previous/click (not the current step)
  private departedSteps = new Set<number>();

  // A step shows a checkmark only if the user left it AND it's valid
  get completedSteps(): Set<number> {
    const completed = new Set<number>();
    for (const s of this.departedSteps) {
      if (this.isStepValid(s)) completed.add(s);
    }
    // In edit mode all steps start as departed since data is pre-filled
    if (this.isEditMode) {
      for (let s = 1; s <= 5; s++) {
        if (this.isStepValid(s)) completed.add(s);
      }
    }
    return completed;
  }

  get activeSection(): string {
    return this.steps[this.currentStep - 1].key;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupEmployeeIdCheck();
    this.loadAvailableManagers();

    if (this.dialogData?.employee) {
      this.isEditMode = true;
      this.employeePublicId = this.dialogData.employee.public_id || null;
      this.employeeForm.patchValue(this.dialogData.employee);
    }
  }

  private setupEmployeeIdCheck(): void {
    const control = this.employeeForm.get('employee_id');
    if (!control) return;

    control.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      if (!value || value.length < 3 || control.hasError('required') || control.hasError('minlength')) {
        return;
      }
      this.checkingEmployeeId.set(true);
      this.employeeService.checkEmployeeId(value, this.employeePublicId || undefined).pipe(
        first()
      ).subscribe(exists => {
        this.checkingEmployeeId.set(false);
        if (exists) {
          control.setErrors({ ...control.errors, duplicate: true });
        } else if (control.hasError('duplicate')) {
          const { duplicate, ...rest } = control.errors || {};
          control.setErrors(Object.keys(rest).length ? rest : null);
        }
      });
    });
  }

  initializeForm(): void {
    this.employeeForm = this.fb.group({
      // Step 1: Personal Info
      employee_id: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      ic_no: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      passport_no: ['', [Validators.maxLength(20)]],
      date_of_birth: ['', Validators.required],
      gender: ['', Validators.required],
      marital_status: ['', Validators.required],
      nationality: ['Malaysian', [Validators.maxLength(50)]],
      race: ['', [Validators.maxLength(50)]],
      religion: ['', [Validators.maxLength(50)]],

      // Step 2: Contact
      mobile: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      emergency_contact_name: ['', [Validators.maxLength(100)]],
      emergency_contact_phone: ['', [Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      current_address: ['', [Validators.maxLength(500)]],
      permanent_address: ['', [Validators.maxLength(500)]],

      // Step 3: Employment
      position: ['', [Validators.maxLength(100)]],
      department: ['', [Validators.maxLength(100)]],
      reporting_manager_id: [null],
      employment_type: ['Probation', Validators.required],
      work_location: ['', [Validators.maxLength(100)]],
      join_date: ['', Validators.required],
      confirmation_date: [''],

      // Step 4: Compensation
      basic_salary: ['', [Validators.required, Validators.min(0)]],
      bank_name: ['', [Validators.maxLength(100)]],
      bank_account_no: ['', [Validators.maxLength(50)]],
      bank_account_holder: ['', [Validators.maxLength(150)]],

      // Step 5: Statutory
      epf_no: ['', [Validators.maxLength(20)]],
      socso_no: ['', [Validators.maxLength(20)]],
      tax_no: ['', [Validators.maxLength(20)]],
      tax_category: ['KA'],
      number_of_children: [0, [Validators.min(0), Validators.max(20)]],
      children_in_higher_education: [0, [Validators.min(0), Validators.max(20)]],
      disabled_children: [0, [Validators.min(0), Validators.max(20)]],
      disabled_self: [false],
      disabled_spouse: [false]
    });
  }

  loadAvailableManagers(): void {
    this.employeeService.getEmployees({ status: 'Active', limit: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data?.employees) {
          const currentId = this.employeePublicId;
          this.availableManagers.set(
            response.data.employees
              .filter((emp: any) => emp.public_id !== currentId)
              .map((emp: any) => ({
                id: emp.id,
                employee_id: emp.employee_id,
                full_name: emp.full_name,
                position: emp.position
              }))
          );
        }
      },
      error: (err) => console.error('Error loading managers:', err)
    });
  }

  // ─── Navigation ─────────────────────────────────────────

  goToStep(step: number): void {
    if (step >= 1 && step <= this.steps.length && step !== this.currentStep) {
      // Going forward requires current step to be valid
      if (step > this.currentStep && !this.isEditMode && !this.departedSteps.has(step)) {
        this.markStepTouched(this.currentStep);
        if (!this.isStepValid(this.currentStep)) return;
      }
      this.departedSteps.add(this.currentStep);
      this.currentStep = step;
    }
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length) {
      // Mark current step fields as touched to show validation errors
      this.markStepTouched(this.currentStep);
      if (!this.isStepValid(this.currentStep)) return;
      this.departedSteps.add(this.currentStep);
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.departedSteps.add(this.currentStep);
      this.currentStep--;
    }
  }

  // ─── Validation ─────────────────────────────────────────

  isStepValid(step: number): boolean {
    const fieldsByStep: Record<number, string[]> = {
      1: ['employee_id', 'full_name', 'ic_no', 'date_of_birth', 'gender', 'marital_status'],
      2: ['mobile', 'email'],
      3: ['join_date', 'employment_type'],
      4: ['basic_salary'],
      5: []
    };

    const fields = fieldsByStep[step] || [];
    if (fields.length === 0) return true;

    return fields.every(f => {
      const control = this.employeeForm.get(f);
      return control && control.valid;
    });
  }

  canProceed(): boolean {
    return this.isStepValid(this.currentStep);
  }

  canGoToStep(step: number): boolean {
    if (step === this.currentStep) return false;
    // In edit mode all steps are reachable
    if (this.isEditMode) return true;
    // Can always go back to previously departed steps
    if (this.departedSteps.has(step)) return true;
    // Going back to earlier steps is always allowed
    if (step < this.currentStep) return true;
    // Going forward only if current step is valid
    return this.isStepValid(this.currentStep);
  }

  validateAll(): boolean {
    return [1, 2, 3, 4, 5].every(s => this.isStepValid(s));
  }

  private markStepTouched(step: number): void {
    const fieldsByStep: Record<number, string[]> = {
      1: ['employee_id', 'full_name', 'ic_no', 'passport_no', 'date_of_birth', 'gender', 'marital_status', 'nationality', 'race', 'religion'],
      2: ['mobile', 'email', 'emergency_contact_name', 'emergency_contact_phone', 'current_address', 'permanent_address'],
      3: ['position', 'department', 'employment_type', 'work_location', 'join_date', 'confirmation_date'],
      4: ['basic_salary', 'bank_name', 'bank_account_no', 'bank_account_holder'],
      5: ['epf_no', 'socso_no', 'tax_no', 'tax_category']
    };

    const fields = fieldsByStep[step] || [];
    fields.forEach(f => {
      const control = this.employeeForm.get(f);
      control?.markAsTouched();
      control?.markAsDirty();
      control?.updateValueAndValidity();
    });
    this.cdr.detectChanges();
  }

  // ─── Helpers ────────────────────────────────────────────

  copyCurrentToPermanent(): void {
    const currentAddress = this.employeeForm.get('current_address')?.value;
    this.employeeForm.patchValue({ permanent_address: currentAddress });
  }

  getControl(name: string) {
    return this.employeeForm?.get(name);
  }

  // ─── Save ───────────────────────────────────────────────

  save(): void {
    // Mark all fields as touched
    Object.keys(this.employeeForm.controls).forEach(key => {
      this.employeeForm.get(key)?.markAsTouched();
    });

    if (!this.validateAll()) {
      // Navigate to first invalid step
      for (let s = 1; s <= 5; s++) {
        if (!this.isStepValid(s)) {
          this.currentStep = s;
          this.markStepTouched(s);
          break;
        }
      }
      return;
    }

    this.saving.set(true);
    const formData = this.employeeForm.value;

    if (this.isEditMode && this.employeePublicId) {
      const updateData: UpdateEmployeeRequest = formData;
      this.employeeService.updateEmployee(this.employeePublicId, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.dialogData?.onSuccess?.(response.data);
            this.dialogRef.close(response.data);
          }
          this.saving.set(false);
        },
        error: (err) => {
          this.saving.set(false);
        }
      });
    } else {
      const createData: CreateEmployeeRequest = formData;
      this.employeeService.createEmployee(createData).subscribe({
        next: (response) => {
          if (response.success) {
            this.dialogData?.onSuccess?.(response.data);
            this.dialogRef.close(response.data);
          }
          this.saving.set(false);
        },
        error: (err) => {
          this.saving.set(false);
        }
      });
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
