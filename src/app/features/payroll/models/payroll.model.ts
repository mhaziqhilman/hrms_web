export interface Payroll {
  id: number;
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
  employee_id?: number;
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
  allowances?: number;
  overtime_pay?: number;
  bonus?: number;
  commission?: number;
  unpaid_leave_deduction?: number;
  other_deductions?: number;
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
  payment_date?: string;
  notes?: string;
  status?: PayrollStatus;
}

export interface Payslip {
  payroll_id: number;
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
  status: PayrollStatus;
  notes?: string;
  generated_at: string;
}

export interface PayslipResponse {
  success: boolean;
  data: Payslip;
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
