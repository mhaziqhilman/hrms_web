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
  username: string;
  full_name: string;
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
  key: string;          // "YYYY-MM" key
  month: number;
  year: number;
  label: string;        // e.g. "Run for Jan 1st - Jan 31st"
  payrollType: string;  // "Regular"
  checkDate: string;    // Latest payment_date in the group
  totalEarnings: number;
  totalDeductions: number;
  totalPay: number;
  employeeCount: number;
  status: PayRunStatus;
  payrolls: Payroll[];  // Individual records in this run
}

export type PayRunStatus = 'Completed' | 'In Progress' | 'Draft' | 'Cancelled' | 'Mixed';

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
