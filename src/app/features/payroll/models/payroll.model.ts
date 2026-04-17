export interface Payroll {
  id: number;
  public_id?: string;
  employee_id: number;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  overtime_pay: number;
  bonus: number;
  commission: number;
  gross_salary: number;
  epf_employee: number;
  epf_employer: number;
  socso_employee: number;
  socso_employer: number;
  eis_employee: number;
  eis_employer: number;
  pcb_deduction: number;
  unpaid_leave_deduction: number;
  other_deductions: number;
  prior_ytd_gross: number;
  prior_ytd_epf: number;
  prior_ytd_pcb: number;
  total_deductions: number;
  net_salary: number;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string;
  status: PayrollStatus;
  processed_by?: number;
  approved_by?: number;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: PayrollEmployee;
  processor?: PayrollUser;
  approver?: PayrollUser;
}

export interface PayrollEmployee {
  id: number;
  employee_id: string;
  full_name: string;
  department: string;
  position: string;
  bank_name?: string;
  bank_account_no?: string;
}

export interface PayrollUser {
  id: number;
  username?: string;
  full_name?: string;
  email?: string;
}

export enum PayrollStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  APPROVED = 'Approved',
  PAID = 'Paid',
  CANCELLED = 'Cancelled'
}

export interface PayrollListParams {
  page?: number;
  limit?: number;
  status?: PayrollStatus;
  year?: number;
  month?: number;
  employee_id?: number | string;
  search?: string;
}

export interface PayrollListResponse {
  success: boolean;
  data: {
    payrolls: Payroll[];
    pagination: {
      total: number;
      currentPage: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface PayrollResponse {
  success: boolean;
  data: Payroll;
  message?: string;
}

export interface CalculatePayrollRequest {
  employee_id: number;
  year: number;
  month: number;
  basic_salary?: number;
  allowances?: number;
  overtime_pay?: number;
  bonus?: number;
  commission?: number;
  unpaid_leave_deduction?: number;
  other_deductions?: number;
  prior_ytd_gross?: number;
  prior_ytd_epf?: number;
  prior_ytd_pcb?: number;
  payment_date?: string;
  notes?: string;
}

export interface UpdatePayrollRequest {
  allowances?: number;
  overtime_pay?: number;
  bonus?: number;
  commission?: number;
  unpaid_leave_deduction?: number;
  other_deductions?: number;
  prior_ytd_gross?: number;
  prior_ytd_epf?: number;
  prior_ytd_pcb?: number;
  payment_date?: string;
  notes?: string;
  status?: PayrollStatus;
}

export interface Payslip {
  payroll_id: number;
  company: {
    name: string;
    registration_no: string;
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
  };
  employee: {
    id: number;
    employee_id: string;
    full_name: string;
    ic_no: string;
    position: string;
    department: string;
    epf_no: string;
    socso_no: string;
    tax_no: string;
  };
  pay_period: {
    month: number;
    year: number;
    start_date: string;
    end_date: string;
    payment_date: string;
  };
  earnings: {
    basic_salary: number;
    allowances: number;
    overtime_pay: number;
    bonus: number;
    commission: number;
    gross_salary: number;
  };
  deductions: {
    epf_employee: number;
    socso_employee: number;
    eis_employee: number;
    pcb_deduction: number;
    unpaid_leave_deduction: number;
    other_deductions: number;
    total_deductions: number;
  };
  employer_contributions: {
    epf_employer: number;
    socso_employer: number;
    eis_employer: number;
  };
  net_salary: number;
  bank_details: {
    bank_name: string;
    account_no: string;
  };
  ytd?: {
    epf_employee: number;
    epf_employer: number;
    socso_employee: number;
    socso_employer: number;
    eis_employee: number;
    eis_employer: number;
    pcb: number;
  };
  status: PayrollStatus;
  notes?: string;
  issued_by?: string;
  generated_at: string;
}

export interface PayslipResponse {
  success: boolean;
  data: Payslip;
}

export interface BulkActionResult {
  id: number;
  success: boolean;
  message: string;
}

export interface BulkActionResponse {
  success: boolean;
  message: string;
  data: {
    successCount: number;
    failCount: number;
    results: BulkActionResult[];
  };
}

export interface PayRun {
  id: number;
  public_id: string;
  company_id: number;
  month: number;
  year: number;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string;
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_employer_cost: number;
  status: PayRunStatus;
  notes?: string;
  created_by?: number;
  creator?: PayrollUser;
  payrolls?: Payroll[];
  created_at: string;
  updated_at: string;
  // Computed for display
  key?: string;
  label?: string;
}

export type PayRunStatus = 'Draft' | 'Pending' | 'Approved' | 'Paid' | 'Cancelled';

export interface PayRunListResponse {
  success: boolean;
  data: PayRun[];
}

export interface PayRunDetailResponse {
  success: boolean;
  data: PayRun & { payrolls: Payroll[] };
}

// ─── Pay Run (Bulk Payroll) Interfaces ───

export interface PayRunEligibleEmployee {
  id: number;
  public_id: string;
  employee_id: string;
  full_name: string;
  department: string;
  position: string;
  basic_salary: number;
  bank_name: string;
  bank_account_no: string;
  join_date: string;
  has_existing_payroll: boolean;
  unpaid_leave_days: number;
  unpaid_leave_deduction: number;
}

export interface PayRunEligibleResponse {
  success: boolean;
  data: {
    employees: PayRunEligibleEmployee[];
    period: { year: number; month: number };
    summary: {
      total_active: number;
      already_processed: number;
      eligible: number;
    };
  };
}

export interface PayRunEmployeeInput {
  employee_id: string;
  basic_salary?: number;
  allowances: number;
  overtime_pay: number;
  bonus: number;
  commission: number;
  unpaid_leave_deduction: number;
  other_deductions: number;
  prior_ytd_gross?: number;
  prior_ytd_epf?: number;
  prior_ytd_pcb?: number;
  notes?: string;
}

export interface PayRunPreviewEmployee {
  employee_id: string;
  employee_name: string;
  department: string;
  basic_salary: number;
  allowances: number;
  overtime_pay: number;
  bonus: number;
  commission: number;
  gross_salary: number;
  epf_employee: number;
  epf_employer: number;
  socso_employee: number;
  socso_employer: number;
  eis_employee: number;
  eis_employer: number;
  pcb_deduction: number;
  unpaid_leave_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
}

export interface PayRunPreviewResponse {
  success: boolean;
  data: {
    period: { year: number; month: number };
    employees: PayRunPreviewEmployee[];
    totals: {
      employee_count: number;
      total_gross: number;
      total_deductions: number;
      total_net: number;
    };
  };
}

export interface PayRunRequest {
  year: number;
  month: number;
  payment_date?: string;
  employees: PayRunEmployeeInput[];
}

export interface PayRunResult {
  employee_id: string;
  employee_name?: string;
  payroll_id?: string;
  success: boolean;
  message?: string;
  net_salary?: number;
}

export interface PayRunResponse {
  success: boolean;
  message: string;
  data: {
    successCount: number;
    failCount: number;
    results: PayRunResult[];
  };
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const PAYROLL_STATUS_COLORS: Record<PayrollStatus, string> = {
  [PayrollStatus.DRAFT]: 'secondary',
  [PayrollStatus.PENDING]: 'warning',
  [PayrollStatus.APPROVED]: 'info',
  [PayrollStatus.PAID]: 'success',
  [PayrollStatus.CANCELLED]: 'danger'
};
