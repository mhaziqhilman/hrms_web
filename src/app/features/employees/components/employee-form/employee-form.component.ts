import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  Gender,
  MaritalStatus,
  EmploymentType
} from '../../models/employee.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardFormControlComponent } from '@/shared/components/form/form-control.component';
import { ZardFormMessageComponent } from '@/shared/components/form/form-message.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardFormControlComponent,
    ZardFormMessageComponent,
    ZardDatePickerComponent
  ],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.css']
})
export class EmployeeFormComponent implements OnInit {
  employeeForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  employeeId = signal<number | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Dropdown options
  genders: Gender[] = ['Male', 'Female'];
  maritalStatuses: MaritalStatus[] = ['Single', 'Married', 'Divorced', 'Widowed'];
  employmentTypes: EmploymentType[] = ['Permanent', 'Contract', 'Probation', 'Intern'];

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.employeeId.set(Number(id));
      this.loadEmployee(Number(id));
    }
  }

  initializeForm(): void {
    this.employeeForm = this.fb.group({
      // Basic Information
      employee_id: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      ic_no: ['', [Validators.pattern(/^\d{12}$/)]],
      passport_no: ['', [Validators.maxLength(20)]],
      date_of_birth: [''],
      gender: ['', Validators.required],
      marital_status: [''],
      nationality: ['Malaysian', [Validators.maxLength(50)]],
      race: ['', [Validators.maxLength(50)]],
      religion: ['', [Validators.maxLength(50)]],

      // Contact Information
      mobile: ['', [Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      emergency_contact_name: ['', [Validators.maxLength(100)]],
      emergency_contact_phone: ['', [Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      current_address: ['', [Validators.maxLength(500)]],
      permanent_address: ['', [Validators.maxLength(500)]],

      // Employment Information
      position: ['', [Validators.maxLength(100)]],
      department: ['', [Validators.maxLength(100)]],
      basic_salary: ['', [Validators.required, Validators.min(0)]],
      join_date: ['', Validators.required],
      confirmation_date: [''],
      employment_type: ['Probation'],
      work_location: ['', [Validators.maxLength(100)]],

      // Banking Information
      bank_name: ['', [Validators.maxLength(100)]],
      bank_account_no: ['', [Validators.maxLength(50)]],
      bank_account_holder: ['', [Validators.maxLength(150)]],

      // Statutory Information
      epf_no: ['', [Validators.maxLength(20)]],
      socso_no: ['', [Validators.maxLength(20)]],
      tax_no: ['', [Validators.maxLength(20)]],
      tax_category: ['Individual', [Validators.maxLength(50)]]
    });
  }

  loadEmployee(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.employeeForm.patchValue(response.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load employee');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.markFormGroupTouched(this.employeeForm);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const formData = this.employeeForm.value;

    if (this.isEditMode() && this.employeeId()) {
      // Update existing employee
      const updateData: UpdateEmployeeRequest = formData;
      this.employeeService.updateEmployee(this.employeeId()!, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage.set('Employee updated successfully');
            setTimeout(() => {
              this.router.navigate(['/dashboard/employees', this.employeeId()]);
            }, 1500);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to update employee');
          this.loading.set(false);
        }
      });
    } else {
      // Create new employee
      const createData: CreateEmployeeRequest = formData;
      this.employeeService.createEmployee(createData).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage.set('Employee created successfully');
            setTimeout(() => {
              this.router.navigate(['/dashboard/employees']);
            }, 1500);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to create employee');
          this.loading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode() && this.employeeId()) {
      this.router.navigate(['/dashboard/employees', this.employeeId()]);
    } else {
      this.router.navigate(['/dashboard/employees']);
    }
  }

  copyCurrentToPermanent(): void {
    const currentAddress = this.employeeForm.get('current_address')?.value;
    this.employeeForm.patchValue({ permanent_address: currentAddress });
  }

  // Form control getters
  get employeeIdControl() { return this.employeeForm?.get('employee_id'); }
  get fullNameControl() { return this.employeeForm?.get('full_name'); }
  get icNoControl() { return this.employeeForm?.get('ic_no'); }
  get passportNoControl() { return this.employeeForm?.get('passport_no'); }
  get dateOfBirthControl() { return this.employeeForm?.get('date_of_birth'); }
  get genderControl() { return this.employeeForm?.get('gender'); }
  get maritalStatusControl() { return this.employeeForm?.get('marital_status'); }
  get nationalityControl() { return this.employeeForm?.get('nationality'); }
  get raceControl() { return this.employeeForm?.get('race'); }
  get religionControl() { return this.employeeForm?.get('religion'); }

  get mobileControl() { return this.employeeForm?.get('mobile'); }
  get emailControl() { return this.employeeForm?.get('email'); }
  get emergencyContactNameControl() { return this.employeeForm?.get('emergency_contact_name'); }
  get emergencyContactPhoneControl() { return this.employeeForm?.get('emergency_contact_phone'); }
  get currentAddressControl() { return this.employeeForm?.get('current_address'); }
  get permanentAddressControl() { return this.employeeForm?.get('permanent_address'); }

  get positionControl() { return this.employeeForm?.get('position'); }
  get departmentControl() { return this.employeeForm?.get('department'); }
  get basicSalaryControl() { return this.employeeForm?.get('basic_salary'); }
  get joinDateControl() { return this.employeeForm?.get('join_date'); }
  get confirmationDateControl() { return this.employeeForm?.get('confirmation_date'); }
  get employmentTypeControl() { return this.employeeForm?.get('employment_type'); }
  get workLocationControl() { return this.employeeForm?.get('work_location'); }

  get bankNameControl() { return this.employeeForm?.get('bank_name'); }
  get bankAccountNoControl() { return this.employeeForm?.get('bank_account_no'); }
  get bankAccountHolderControl() { return this.employeeForm?.get('bank_account_holder'); }

  get epfNoControl() { return this.employeeForm?.get('epf_no'); }
  get socsoNoControl() { return this.employeeForm?.get('socso_no'); }
  get taxNoControl() { return this.employeeForm?.get('tax_no'); }
  get taxCategoryControl() { return this.employeeForm?.get('tax_category'); }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.employeeForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['email']) return 'Invalid email format';
      if (field.errors['pattern']) return 'Invalid format';
      if (field.errors['maxLength']) return `Maximum ${field.errors['maxLength'].requiredLength} characters allowed`;
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
    }
    return '';
  }
}
