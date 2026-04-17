import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardFormControlComponent } from '@/shared/components/form/form-control.component';
import { ZardFormMessageComponent } from '@/shared/components/form/form-message.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';

import { PayrollService } from '../../services/payroll.service';
import { AdminSettingsService } from '../../../admin-settings/services/admin-settings.service';
import { StatutoryConfigItem } from '../../../admin-settings/models/admin-settings.models';
import {
  PayRunEligibleEmployee,
  PayRunEmployeeInput,
  PayRunPreviewEmployee,
  MONTH_NAMES
} from '../../models/payroll.model';

interface StepConfig {
  number: number;
  key: string;
  label: string;
  description: string;
  icon: string;
}

interface AdjustmentRow {
  employee: PayRunEligibleEmployee;
  basic_salary_override: number | null;
  allowances: number;
  overtime_pay: number;
  bonus: number;
  commission: number;
  unpaid_leave_deduction: number;
  other_deductions: number;
  prior_ytd_gross: number;
  prior_ytd_epf: number;
  prior_ytd_pcb: number;
  notes: string;
  expanded: boolean;
  showPriorYtd: boolean;
  showProration: boolean;
  days_worked: number | null;
}

export interface PayRunDialogData {
  onSuccess?: () => void;
  year?: number;
  month?: number;
}

@Component({
  selector: 'app-payrun-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardFormControlComponent,
    ZardFormMessageComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardDatePickerComponent,
    ZardCheckboxComponent,
    ZardBadgeComponent
  ],
  templateUrl: './payrun-dialog.component.html',
  styleUrls: ['./payrun-dialog.component.css']
})
export class PayRunDialogComponent implements OnInit {
  private dialogRef = inject(ZardDialogRef);
  private dialogData = inject(Z_MODAL_DATA, { optional: true }) as PayRunDialogData | null;
  private payrollService = inject(PayrollService);
  private adminSettingsService = inject(AdminSettingsService);

  // Step configuration
  steps: StepConfig[] = [
    { number: 1, key: 'period', label: 'Pay Period', description: 'Select month & year', icon: 'calendar' },
    { number: 2, key: 'employees', label: 'Employees', description: 'Select staff members', icon: 'users' },
    { number: 3, key: 'adjustments', label: 'Adjustments', description: 'Edit earnings & deductions', icon: 'pencil' },
    { number: 4, key: 'review', label: 'Review & Confirm', description: 'Verify and submit', icon: 'check-circle' }
  ];

  currentStep = signal(1);
  completedSteps = signal(new Set<number>());

  // Step 1: Pay Period
  selectedYear = signal(new Date().getFullYear());
  selectedMonth = signal(new Date().getMonth() + 1);
  paymentDate = signal<Date | null>(null);
  availableYears: number[] = [];
  monthNames = MONTH_NAMES;

  // Step 2: Employee Selection
  eligibleEmployees = signal<PayRunEligibleEmployee[]>([]);
  selectedEmployeeIds = signal(new Set<string>());
  employeeSearch = signal('');
  loadingEmployees = signal(false);
  eligibleSummary = signal({ total_active: 0, already_processed: 0, eligible: 0 });

  // Step 3: Adjustments
  adjustmentRows = signal<AdjustmentRow[]>([]);

  // Step 4: Review
  previewData = signal<PayRunPreviewEmployee[]>([]);
  previewTotals = signal({ employee_count: 0, total_gross: 0, total_deductions: 0, total_net: 0 });
  loadingPreview = signal(false);

  // Statutory config reference
  statutoryConfigs = signal<StatutoryConfigItem[]>([]);

  // Submission
  submitting = signal(false);

  // Computed
  activeSection = computed(() => this.steps[this.currentStep() - 1].key);

  filteredEmployees = computed(() => {
    const search = this.employeeSearch().toLowerCase();
    const employees = this.eligibleEmployees();
    if (!search) return employees;
    return employees.filter(e =>
      e.full_name.toLowerCase().includes(search) ||
      e.employee_id.toLowerCase().includes(search) ||
      (e.department || '').toLowerCase().includes(search)
    );
  });

  selectedCount = computed(() => this.selectedEmployeeIds().size);

  selectableEmployees = computed(() =>
    this.eligibleEmployees().filter(e => !e.has_existing_payroll)
  );

  allSelectableSelected = computed(() => {
    const selectable = this.selectableEmployees();
    if (selectable.length === 0) return false;
    const selected = this.selectedEmployeeIds();
    return selectable.every(e => selected.has(e.public_id));
  });

  payPeriodLabel = computed(() => {
    const m = this.selectedMonth();
    const y = this.selectedYear();
    return `${MONTH_NAMES[m - 1]} ${y}`;
  });

  paymentDateLabel = computed(() => {
    const d = this.paymentDate();
    if (!d) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
  });

  // Statutory config grouped for display (EPF, SOCSO, EIS only)
  epfConfigs = computed(() => this.statutoryConfigs().filter(c => c.config_key.startsWith('epf_')));
  socsoConfigs = computed(() => this.statutoryConfigs().filter(c => c.config_key.startsWith('socso_')));
  eisConfigs = computed(() => this.statutoryConfigs().filter(c => c.config_key.startsWith('eis_')));

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    // Apply prefill from caller (e.g. Run Payroll button on a delayed month row)
    if (this.dialogData?.year) this.selectedYear.set(this.dialogData.year);
    if (this.dialogData?.month) this.selectedMonth.set(this.dialogData.month);

    // Set default payment date to 25th of next month
    this.updateDefaultPaymentDate();

    // Load statutory config for reference
    this.adminSettingsService.getStatutoryConfig().subscribe({
      next: (res) => {
        if (res.data) this.statutoryConfigs.set(res.data);
      }
    });
  }

  private updateDefaultPaymentDate(): void {
    const y = this.selectedYear();
    const m = this.selectedMonth();
    this.paymentDate.set(new Date(y, m, 25)); // next month's 25th
  }

  onPaymentDateChange(date: Date | null): void {
    this.paymentDate.set(date);
  }

  onPeriodChange(): void {
    this.updateDefaultPaymentDate();
    // Reset downstream data
    this.eligibleEmployees.set([]);
    this.selectedEmployeeIds.set(new Set());
    this.adjustmentRows.set([]);
    this.previewData.set([]);
    this.completedSteps.update(s => { const n = new Set(s); n.delete(2); n.delete(3); n.delete(4); return n; });
  }

  // ─── Employee Loading ───

  loadEligibleEmployees(): void {
    this.loadingEmployees.set(true);
    this.payrollService.getPayRunEligible(this.selectedYear(), this.selectedMonth()).subscribe({
      next: (res) => {
        this.eligibleEmployees.set(res.data.employees);
        this.eligibleSummary.set(res.data.summary);
        this.loadingEmployees.set(false);
      },
      error: () => {
        this.loadingEmployees.set(false);
      }
    });
  }

  // ─── Employee Selection ───

  toggleEmployee(publicId: string): void {
    this.selectedEmployeeIds.update(ids => {
      const next = new Set(ids);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  }

  toggleAllEmployees(): void {
    const selectable = this.selectableEmployees();
    if (this.allSelectableSelected()) {
      this.selectedEmployeeIds.set(new Set());
    } else {
      this.selectedEmployeeIds.set(new Set(selectable.map(e => e.public_id)));
    }
  }

  isSelected(publicId: string): boolean {
    return this.selectedEmployeeIds().has(publicId);
  }

  clearSelection(): void {
    this.selectedEmployeeIds.set(new Set());
  }

  // ─── Adjustments ───

  private buildAdjustmentRows(): void {
    const selected = this.selectedEmployeeIds();
    const employees = this.eligibleEmployees().filter(e => selected.has(e.public_id));
    const existingMap = new Map(this.adjustmentRows().map(r => [r.employee.public_id, r]));

    this.adjustmentRows.set(employees.map(emp => {
      const existing = existingMap.get(emp.public_id);
      if (existing) return { ...existing, employee: emp };
      return {
        employee: emp,
        basic_salary_override: null,
        allowances: 0,
        overtime_pay: 0,
        bonus: 0,
        commission: 0,
        unpaid_leave_deduction: emp.unpaid_leave_deduction,
        other_deductions: 0,
        prior_ytd_gross: 0,
        prior_ytd_epf: 0,
        prior_ytd_pcb: 0,
        notes: '',
        expanded: false,
        showPriorYtd: false,
        showProration: false,
        days_worked: null
      };
    }));
  }

  toggleExpandRow(index: number): void {
    this.adjustmentRows.update(rows => {
      const updated = [...rows];
      updated[index] = { ...updated[index], expanded: !updated[index].expanded };
      return updated;
    });
  }

  togglePriorYtdRow(index: number): void {
    this.adjustmentRows.update(rows => {
      const updated = [...rows];
      updated[index] = { ...updated[index], showPriorYtd: !updated[index].showPriorYtd };
      return updated;
    });
  }

  toggleProrationRow(index: number): void {
    this.adjustmentRows.update(rows => {
      const updated = [...rows];
      const row = updated[index];
      const next = !row.showProration;
      updated[index] = {
        ...row,
        showProration: next,
        days_worked: next && row.days_worked === null ? this.daysInMonth() : row.days_worked
      };
      return updated;
    });
  }

  setDaysWorked(index: number, value: number): void {
    this.adjustmentRows.update(rows => {
      const updated = [...rows];
      updated[index] = { ...updated[index], days_worked: value };
      return updated;
    });
  }

  daysInMonth(): number {
    return new Date(this.selectedYear(), this.selectedMonth(), 0).getDate();
  }

  effectiveBasicSalary(row: AdjustmentRow): number {
    return row.basic_salary_override != null ? row.basic_salary_override : row.employee.basic_salary;
  }

  proratedRowSalary(row: AdjustmentRow): number {
    const days = Number(row.days_worked || 0);
    const total = this.daysInMonth();
    if (!total || days <= 0) return 0;
    return Math.round(row.employee.basic_salary * (days / total) * 100) / 100;
  }

  applyRowProration(index: number): void {
    this.adjustmentRows.update(rows => {
      const updated = [...rows];
      const row = updated[index];
      updated[index] = {
        ...row,
        basic_salary_override: this.proratedRowSalary(row),
        showProration: false
      };
      return updated;
    });
  }

  clearBasicOverride(index: number): void {
    this.adjustmentRows.update(rows => {
      const updated = [...rows];
      updated[index] = { ...updated[index], basic_salary_override: null, days_worked: null };
      return updated;
    });
  }

  getRowGross(row: AdjustmentRow): number {
    return this.effectiveBasicSalary(row) + row.allowances + row.overtime_pay + row.bonus + row.commission;
  }

  getRowEstimatedNet(row: AdjustmentRow): number {
    const gross = this.getRowGross(row);
    return gross - row.unpaid_leave_deduction - row.other_deductions;
  }

  // ─── Preview ───

  private loadPreview(): void {
    this.loadingPreview.set(true);
    const request = this.buildPayRunRequest();

    this.payrollService.bulkPreview(request).subscribe({
      next: (res) => {
        this.previewData.set(res.data.employees);
        this.previewTotals.set(res.data.totals);
        this.loadingPreview.set(false);
      },
      error: () => {
        this.loadingPreview.set(false);
      }
    });
  }

  private formatDateToISO(date: Date | null): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private buildPayRunRequest() {
    const employees: PayRunEmployeeInput[] = this.adjustmentRows().map(row => ({
      employee_id: row.employee.public_id,
      ...(row.basic_salary_override != null ? { basic_salary: row.basic_salary_override } : {}),
      allowances: row.allowances,
      overtime_pay: row.overtime_pay,
      bonus: row.bonus,
      commission: row.commission,
      unpaid_leave_deduction: row.unpaid_leave_deduction,
      other_deductions: row.other_deductions,
      prior_ytd_gross: row.prior_ytd_gross,
      prior_ytd_epf: row.prior_ytd_epf,
      prior_ytd_pcb: row.prior_ytd_pcb,
      notes: row.notes
    }));

    return {
      year: this.selectedYear(),
      month: this.selectedMonth(),
      payment_date: this.formatDateToISO(this.paymentDate()),
      employees
    };
  }

  // ─── Navigation ───

  canGoToStep(step: number): boolean {
    if (step === 1) return true;
    if (step === 2) return this.completedSteps().has(1);
    if (step === 3) return this.completedSteps().has(1) && this.completedSteps().has(2);
    if (step === 4) return this.completedSteps().has(1) && this.completedSteps().has(2) && this.completedSteps().has(3);
    return false;
  }

  goToStep(step: number): void {
    if (this.canGoToStep(step)) {
      this.currentStep.set(step);
      if (step === 4) this.loadPreview();
    }
  }

  nextStep(): void {
    const current = this.currentStep();

    if (current === 1) {
      if (!this.selectedYear() || !this.selectedMonth()) return;
      this.completedSteps.update(s => { const n = new Set(s); n.add(1); return n; });
      this.currentStep.set(2);
      this.loadEligibleEmployees();
    } else if (current === 2) {
      if (this.selectedCount() === 0) return;
      this.completedSteps.update(s => { const n = new Set(s); n.add(2); return n; });
      this.buildAdjustmentRows();
      this.currentStep.set(3);
    } else if (current === 3) {
      this.completedSteps.update(s => { const n = new Set(s); n.add(3); return n; });
      this.currentStep.set(4);
      this.loadPreview();
    }
  }

  previousStep(): void {
    const current = this.currentStep();
    if (current > 1) this.currentStep.set(current - 1);
  }

  // ─── Submit ───

  confirmPayRun(): void {
    this.submitting.set(true);
    const request = this.buildPayRunRequest();

    this.payrollService.bulkCalculate(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.dialogData?.onSuccess?.();
        this.dialogRef.close();
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  // ─── Utilities ───

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(value);
  }

  getConfigLabel(key: string): string {
    const labels: Record<string, string> = {
      epf_employee_rate: 'Employee Rate',
      epf_employer_rate: 'Employer Rate',
      epf_employer_rate_below_5000: 'Employer Rate (≤ RM5K)',
      epf_employer_rate_above_5000: 'Employer Rate (> RM5K)',
      epf_employer_threshold: 'Employer Threshold',
      socso_employee_rate: 'Employee Rate',
      socso_employer_rate: 'Employer Rate',
      socso_employee_rate_approx: 'Employee Rate',
      socso_employer_rate_approx: 'Employer Rate',
      socso_max_salary: 'Max Salary',
      eis_employee_rate: 'Employee Rate',
      eis_employer_rate: 'Employer Rate',
      eis_rate: 'Rate',
      eis_max_salary: 'Max Salary'
    };
    return labels[key] || key.replace(/(epf_|socso_|eis_)/g, '').replace(/_/g, ' ');
  }

  formatConfigValue(value: string, key: string): string {
    if (key.includes('max_salary') || key.includes('threshold')) {
      return `RM ${parseFloat(value).toLocaleString()}`;
    }
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (num <= 1 && key.includes('rate')) return `${(num * 100).toFixed(1)}%`;
    if (num > 1 && num < 100 && key.includes('rate')) return `${num}%`;
    return value;
  }

  trackByPublicId(_: number, emp: PayRunEligibleEmployee): string {
    return emp.public_id;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
