// Personal Module Models

export interface EmployeeProfile {
  id: number;
  employee_id: string;
  full_name: string;
  ic_no: string | null;
  passport_no: string | null;
  date_of_birth: string | null;
  gender: 'Male' | 'Female';
  marital_status: string | null;
  nationality: string;
  race: string | null;
  religion: string | null;
  mobile: string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  current_address: string | null;
  permanent_address: string | null;
  position: string | null;
  department: string | null;
  reporting_manager_id: number | null;
  basic_salary: number;
  join_date: string;
  confirmation_date: string | null;
  employment_type: string;
  employment_status: string;
  work_location: string | null;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_holder: string | null;
  epf_no: string | null;
  socso_no: string | null;
  tax_no: string | null;
  tax_category: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  mobile?: string;
  email?: string;
  current_address?: string;
  permanent_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  photo_url?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface MyPayslip {
  id: number;
  employee_id: number;
  year: number;
  month: number;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string;
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
  status: string;
  payment_method: string;
  employee?: {
    id: number;
    employee_id: string;
    full_name: string;
    position: string;
    department: string;
  };
}

export interface YTDSummary {
  year: number;
  total_gross: number;
  total_net: number;
  total_epf: number;
  total_socso: number;
  total_eis: number;
  total_pcb: number;
}

// API Response types
export interface EmployeeProfileResponse {
  success: boolean;
  data: EmployeeProfile;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: EmployeeProfile;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface MyPayslipsResponse {
  success: boolean;
  data: {
    payslips: MyPayslip[];
    ytd_summary: YTDSummary;
    pagination: {
      total: number;
      currentPage: number;
      limit: number;
      totalPages: number;
    };
  };
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
