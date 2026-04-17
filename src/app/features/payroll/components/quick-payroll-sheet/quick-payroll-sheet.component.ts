import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PayrollService } from '../../services/payroll.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { MONTH_NAMES } from '../../models/payroll.model';
import { Employee } from '../../../employees/models/employee.model';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardFormMessageComponent } from '@/shared/components/form/form-message.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardSheetImports } from '@/shared/components/sheet/sheet.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

@Component({
  selector: 'app-quick-payroll-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ZardSheetImports,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardFormMessageComponent,
    ZardInputDirective,
    ZardDatePickerComponent,
    ZardDividerComponent
  ],
  templateUrl: './quick-payroll-sheet.component.html'
})
export class QuickPayrollSheetComponent implements OnChanges {
  @Input() zOpen = false;
  @Input() zPayrollPublicId: string | null = null;
  @Output() zOpenChange = new EventEmitter<boolean>();
  @Output() zSaved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private payrollService = inject(PayrollService);
  private employeeService = inject(EmployeeService);
  private alertDialog = inject(ZardAlertDialogService);

  payrollForm!: FormGroup;

  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  employees = signal<Employee[]>([]);
  loadingEmployees = signal(false);

  isEditMode = signal(false);
  showPriorYtd = signal(false);
  showProration = signal(false);
  daysWorked = signal<number | null>(null);

  calculatedGrossSalary = signal(0);
  calculatedTotalDeductions = signal(0);
  calculatedNetSalary = signal(0);

  MONTH_NAMES = MONTH_NAMES;
  months: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
  years: number[] = [];

  constructor() {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 3; i++) this.years.push(currentYear - i);
    this.initializeForm();
    this.payrollForm.valueChanges.subscribe(() => this.calculateTotals());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['zOpen'] && this.zOpen) {
      this.resetForOpen();
    }
  }

  private resetForOpen(): void {
    this.error.set(null);
    this.showPriorYtd.set(false);
    this.showProration.set(false);
    this.daysWorked.set(null);
    this.loadEmployees();

    if (this.zPayrollPublicId) {
      this.isEditMode.set(true);
      this.payrollForm.get('employee_id')?.disable();
      this.loadPayrollData(this.zPayrollPublicId);
    } else {
      this.isEditMode.set(false);
      this.payrollForm.get('employee_id')?.enable();
      this.payrollForm.reset({
        employee_id: null,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        basic_salary: 0,
        allowances: 0,
        overtime_pay: 0,
        bonus: 0,
        commission: 0,
        unpaid_leave_deduction: 0,
        other_deductions: 0,
        prior_ytd_gross: 0,
        prior_ytd_epf: 0,
        prior_ytd_pcb: 0,
        payment_date: null,
        notes: ''
      });
    }
  }

  private initializeForm(): void {
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
      prior_ytd_gross: [0, [Validators.min(0)]],
      prior_ytd_epf: [0, [Validators.min(0)]],
      prior_ytd_pcb: [0, [Validators.min(0)]],
      payment_date: [null, Validators.required],
      notes: ['']
    });

    this.payrollForm.get('employee_id')?.valueChanges.subscribe((value) => {
      this.onEmployeeChange(value);
    });
  }

  private loadEmployees(): void {
    this.loadingEmployees.set(true);
    this.employeeService.getEmployees({ status: 'Active', limit: 100 }).subscribe({
      next: (response) => {
        if (response.success) this.employees.set(response.data.employees);
        this.loadingEmployees.set(false);
      },
      error: () => {
        this.loadingEmployees.set(false);
      }
    });
  }

  private loadPayrollData(id: string): void {
    this.loading.set(true);
    this.payrollService.getPayrollById(id).subscribe({
      next: (response) => {
        if (response.success) {
          const payroll = response.data;
          const paymentDate = payroll.payment_date ? new Date(payroll.payment_date) : null;
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
            prior_ytd_gross: payroll.prior_ytd_gross || 0,
            prior_ytd_epf: payroll.prior_ytd_epf || 0,
            prior_ytd_pcb: payroll.prior_ytd_pcb || 0,
            payment_date: paymentDate,
            notes: payroll.notes || ''
          });
          if (Number(payroll.prior_ytd_gross) > 0 || Number(payroll.prior_ytd_epf) > 0 || Number(payroll.prior_ytd_pcb) > 0) {
            this.showPriorYtd.set(true);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        const message = err.error?.message || 'Failed to load payroll data';
        this.error.set(message);
        this.loading.set(false);
      }
    });
  }

  private onEmployeeChange(employeeId: any): void {
    const employee = this.employees().find(e => (e as any).public_id === employeeId);
    if (employee && !this.isEditMode()) {
      this.payrollForm.patchValue({ basic_salary: employee.basic_salary });
    }
  }

  private calculateTotals(): void {
    const values = this.payrollForm.value;
    const grossSalary =
      Number(values.basic_salary || 0) +
      Number(values.allowances || 0) +
      Number(values.overtime_pay || 0) +
      Number(values.bonus || 0) +
      Number(values.commission || 0);
    this.calculatedGrossSalary.set(grossSalary);

    const manualDeductions =
      Number(values.unpaid_leave_deduction || 0) +
      Number(values.other_deductions || 0);
    const estimatedEPF = Math.ceil(grossSalary * 0.11);
    const estimatedSOCSO = grossSalary > 6000 ? 29.75 : grossSalary * 0.005;
    const estimatedEIS = grossSalary > 6000 ? 11.90 : grossSalary * 0.002;
    const totalDeductions = estimatedEPF + estimatedSOCSO + estimatedEIS + manualDeductions;
    this.calculatedTotalDeductions.set(totalDeductions);
    this.calculatedNetSalary.set(grossSalary - totalDeductions);
  }

  togglePriorYtd(): void {
    this.showPriorYtd.update((v) => !v);
  }

  toggleProration(): void {
    const next = !this.showProration();
    this.showProration.set(next);
    if (next && this.daysWorked() === null) {
      this.daysWorked.set(this.daysInMonth());
    }
  }

  daysInMonth(): number {
    const year = Number(this.payrollForm.get('year')?.value);
    const month = Number(this.payrollForm.get('month')?.value);
    if (!year || !month) return 30;
    return new Date(year, month, 0).getDate();
  }

  proratedSalary(): number {
    const basic = Number(this.payrollForm.get('basic_salary')?.value || 0);
    const days = Number(this.daysWorked() || 0);
    const total = this.daysInMonth();
    if (!total || days <= 0) return 0;
    return Math.round(basic * (days / total) * 100) / 100;
  }

  applyProration(): void {
    this.payrollForm.patchValue({ basic_salary: this.proratedSalary() });
    this.showProration.set(false);
  }

  onSubmit(): void {
    if (this.payrollForm.invalid) {
      Object.keys(this.payrollForm.controls).forEach(k => this.payrollForm.get(k)?.markAsTouched());
      return;
    }
    this.submitting.set(true);
    this.error.set(null);

    const raw = this.payrollForm.getRawValue();
    const formData: any = {
      employee_id: raw.employee_id,
      month: Number(raw.month),
      year: Number(raw.year),
      basic_salary: Number(raw.basic_salary || 0),
      allowances: Number(raw.allowances || 0),
      overtime_pay: Number(raw.overtime_pay || 0),
      bonus: Number(raw.bonus || 0),
      commission: Number(raw.commission || 0),
      unpaid_leave_deduction: Number(raw.unpaid_leave_deduction || 0),
      other_deductions: Number(raw.other_deductions || 0),
      prior_ytd_gross: Number(raw.prior_ytd_gross || 0),
      prior_ytd_epf: Number(raw.prior_ytd_epf || 0),
      prior_ytd_pcb: Number(raw.prior_ytd_pcb || 0),
      payment_date: raw.payment_date instanceof Date ? raw.payment_date.toISOString() : raw.payment_date,
      notes: raw.notes || ''
    };

    const request$ = this.isEditMode() && this.zPayrollPublicId
      ? this.payrollService.updatePayroll(this.zPayrollPublicId, formData)
      : this.payrollService.calculatePayroll(formData);

    request$.subscribe({
      next: (response) => {
        this.submitting.set(false);
        if (response.success) {
          this.zSaved.emit();
          this.close();
        }
      },
      error: (err) => {
        const message = err.error?.message || (this.isEditMode() ? 'Failed to update payroll' : 'Failed to calculate payroll');
        this.error.set(message);
        this.submitting.set(false);
        this.alertDialog.warning({
          zTitle: this.isEditMode() ? 'Failed to Update Payroll' : 'Failed to Calculate Payroll',
          zDescription: message,
          zOkText: 'OK'
        });
      }
    });
  }

  close(): void {
    this.zOpenChange.emit(false);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.payrollForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.payrollForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Required';
      if (field.errors['min']) return `Must be >= ${field.errors['min'].min}`;
      if (field.errors['max']) return `Must be <= ${field.errors['max'].max}`;
    }
    return '';
  }

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) return 'RM 0.00';
    return `RM ${numAmount.toFixed(2)}`;
  }

  getMonthName(month: number): string {
    return MONTH_NAMES[month - 1];
  }
}
