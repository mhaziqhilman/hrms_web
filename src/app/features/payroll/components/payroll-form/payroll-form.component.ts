import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PayrollService } from '../../services/payroll.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { Payroll, MONTH_NAMES } from '../../models/payroll.model';
import { Employee } from '../../../employees/models/employee.model';

// ZardUI Component Imports
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardFormMessageComponent } from '@/shared/components/form/form-message.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

@Component({
  selector: 'app-payroll-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ZardButtonComponent,
    ZardIconComponent,
    ZardCardComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardFormMessageComponent,
    ZardInputDirective,
    ZardDatePickerComponent
  ],
  templateUrl: './payroll-form.component.html',
  styleUrl: './payroll-form.component.css'
})
export class PayrollFormComponent implements OnInit {
  private alertDialog = inject(ZardAlertDialogService);

  payrollForm!: FormGroup;
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  employees = signal<Employee[]>([]);
  loadingEmployees = signal(false);

  isEditMode = signal(false);
  payrollId = signal<number | null>(null);

  // Constants
  MONTH_NAMES = MONTH_NAMES;
  currentYear = new Date().getFullYear();
  years: number[] = [];
  months: number[] = Array.from({ length: 12 }, (_, i) => i + 1);

  // Calculated values
  calculatedGrossSalary = signal(0);
  calculatedTotalDeductions = signal(0);
  calculatedNetSalary = signal(0);

  constructor(
    private fb: FormBuilder,
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Generate year options (current year and 2 previous years)
    for (let i = 0; i < 3; i++) {
      this.years.push(this.currentYear - i);
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadEmployees();

    // Check if edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.payrollId.set(Number(id));
      this.loadPayrollData(Number(id));
    }

    // Subscribe to form value changes for auto-calculation
    this.payrollForm.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  initializeForm(): void {
    const currentDate = new Date();

    this.payrollForm = this.fb.group({
      employee_id: [null, Validators.required],
      month: [currentDate.getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      year: [currentDate.getFullYear(), [Validators.required, Validators.min(2020)]],
      basic_salary: [0, [Validators.required, Validators.min(0)]],
      allowances: [0, [Validators.min(0)]],
      overtime_pay: [0, [Validators.min(0)]],
      bonus: [0, [Validators.min(0)]],
      commission: [0, [Validators.min(0)]],
      unpaid_leave_deduction: [0, [Validators.min(0)]],
      other_deductions: [0, [Validators.min(0)]],
      payment_date: [null, Validators.required],
      notes: ['']
    });
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
        const message = err.message || 'Failed to load employees';
        this.error.set(message);
        this.loadingEmployees.set(false);
        this.alertDialog.warning({
          zTitle: 'Failed to Load Employees',
          zDescription: message,
          zOkText: 'OK'
        });
      }
    });
  }

  loadPayrollData(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.payrollService.getPayrollById(id).subscribe({
      next: (response) => {
        if (response.success) {
          const payroll = response.data;

          const paymentDate = payroll.payment_date
            ? new Date(payroll.payment_date)
            : null;

          this.payrollForm.patchValue({
            employee_id: payroll.employee_id,
            month: payroll.month,
            year: payroll.year,
            basic_salary: payroll.basic_salary,
            allowances: payroll.allowances || 0,
            overtime_pay: payroll.overtime_pay || 0,
            bonus: payroll.bonus || 0,
            commission: payroll.commission || 0,
            unpaid_leave_deduction: payroll.unpaid_leave_deduction || 0,
            other_deductions: payroll.other_deductions || 0,
            payment_date: paymentDate,
            notes: payroll.notes || ''
          });
        }
        this.loading.set(false);
      },
      error: (err) => {
        const message = err.message || 'Failed to load payroll data';
        this.error.set(message);
        this.loading.set(false);
        this.alertDialog.warning({
          zTitle: 'Failed to Load Payroll',
          zDescription: message,
          zOkText: 'OK'
        });
      }
    });
  }

  onEmployeeChange(employeeId: any): void {
    const employee = this.employees().find(e => e.id === Number(employeeId));

    if (employee && !this.isEditMode()) {
      // Auto-fill basic salary for new payroll
      this.payrollForm.patchValue({
        basic_salary: employee.basic_salary
      });
    }
  }

  calculateTotals(): void {
    const values = this.payrollForm.value;

    // Calculate gross salary
    const grossSalary =
      Number(values.basic_salary || 0) +
      Number(values.allowances || 0) +
      Number(values.overtime_pay || 0) +
      Number(values.bonus || 0) +
      Number(values.commission || 0);

    this.calculatedGrossSalary.set(grossSalary);

    // Deductions (EPF, SOCSO, EIS, PCB will be calculated by backend)
    // We only show manual deductions here
    const manualDeductions =
      Number(values.unpaid_leave_deduction || 0) +
      Number(values.other_deductions || 0);

    // Estimated statutory deductions (EPF 11% + SOCSO table-based + EIS table-based)
    const estimatedEPF = grossSalary * 0.11;
    // SOCSO: approximate using ~0.5% capped at RM6,000 (actual uses official wage-band table)
    const estimatedSOCSO = grossSalary > 6000 ? 29.75 : grossSalary * 0.005;
    // EIS: approximate using ~0.2% capped at RM6,000 (actual uses official wage-band table)
    const estimatedEIS = grossSalary > 6000 ? 11.90 : grossSalary * 0.002;
    const estimatedStatutoryDeductions = estimatedEPF + estimatedSOCSO + estimatedEIS;
    const totalDeductions = estimatedStatutoryDeductions + manualDeductions;

    this.calculatedTotalDeductions.set(totalDeductions);

    // Calculate net salary
    const netSalary = grossSalary - totalDeductions;
    this.calculatedNetSalary.set(netSalary);
  }

  onSubmit(): void {
    if (this.payrollForm.invalid) {
      this.markFormGroupTouched(this.payrollForm);
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formData = this.payrollForm.value;

    if (this.isEditMode() && this.payrollId()) {
      // Update existing payroll
      this.payrollService.updatePayroll(this.payrollId()!, formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.alertDialog.info({
              zTitle: 'Success',
              zDescription: 'Payroll updated successfully',
              zOkText: 'OK',
              zOnOk: () => this.router.navigate(['/payroll'])
            });
          }
          this.submitting.set(false);
        },
        error: (err) => {
          const message = err.message || 'Failed to update payroll';
          this.error.set(message);
          this.submitting.set(false);
          this.alertDialog.warning({
            zTitle: 'Failed to Update Payroll',
            zDescription: message,
            zOkText: 'OK'
          });
        }
      });
    } else {
      // Calculate new payroll
      this.payrollService.calculatePayroll(formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.alertDialog.info({
              zTitle: 'Success',
              zDescription: 'Payroll calculated successfully',
              zOkText: 'OK',
              zOnOk: () => this.router.navigate(['/payroll'])
            });
          }
          this.submitting.set(false);
        },
        error: (err) => {
          const message = err.message || 'Failed to calculate payroll';
          this.error.set(message);
          this.submitting.set(false);
          this.alertDialog.warning({
            zTitle: 'Failed to Calculate Payroll',
            zDescription: message,
            zOkText: 'OK'
          });
        }
      });
    }
  }

  onCancel(): void {
    this.alertDialog.confirm({
      zTitle: 'Cancel',
      zDescription: 'Are you sure you want to cancel? Any unsaved changes will be lost.',
      zOkText: 'Yes, Cancel',
      zCancelText: 'No, Stay',
      zOnOk: () => this.router.navigate(['/payroll'])
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.payrollForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.payrollForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} must be >= ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} must be <= ${field.errors['max'].max}`;
    }
    return '';
  }

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RM 0.00';
    }
    return `RM ${numAmount.toFixed(2)}`;
  }

  getMonthName(month: number): string {
    return MONTH_NAMES[month - 1];
  }
}
