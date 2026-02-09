/**
 * Statutory Reports Models
 */
import type { ZardIcon } from '@/shared/components/icon/icons';

// Available periods response
export interface AvailablePeriodsResponse {
  success: boolean;
  data: { [year: string]: number[] };
}

// Employee for EA form selection
export interface EAEmployee {
  id: number;
  employee_id: string;
  full_name: string;
  ic_no: string;
  department: string;
  position: string;
}

export interface EAEmployeesResponse {
  success: boolean;
  data: EAEmployee[];
}

// EA Form data
export interface EAFormData {
  year: number;
  employer: {
    name: string;
    registration_no: string;
    e_file_no: string;
  };
  employee: {
    id: number;
    employee_id: string;
    full_name: string;
    ic_no: string;
    tax_no: string;
    position: string;
    department: string;
  };
  income: {
    salary: number;
    allowances: number;
    bonus: number;
    commission: number;
    overtime: number;
    gross_total: number;
  };
  deductions: {
    epf_employee: number;
    socso_employee: number;
    eis_employee: number;
    pcb: number;
    total: number;
  };
  employer_contributions: {
    epf: number;
    socso: number;
    eis: number;
  };
  months_worked: number;
  net_income: number;
}

export interface EAFormResponse {
  success: boolean;
  data: EAFormData;
}

// EPF Borang A data
export interface EPFEmployee {
  employee_id: string;
  full_name: string;
  ic_no: string;
  epf_no: string;
  wages: number;
  employee_epf: number;
  employer_epf: number;
  total_epf: number;
}

export interface EPFBorangAData {
  year: number;
  month: number;
  employer: {
    name: string;
    epf_no: string;
  };
  employees: EPFEmployee[];
  totals: {
    wages: number;
    employee_epf: number;
    employer_epf: number;
    total_epf: number;
  };
  employee_count: number;
}

export interface EPFBorangAResponse {
  success: boolean;
  data: EPFBorangAData;
}

// SOCSO Form 8A data
export interface SOCSOEmployee {
  employee_id: string;
  full_name: string;
  ic_no: string;
  socso_no: string;
  wages: number;
  employee_socso: number;
  employer_socso: number;
  total_socso: number;
}

export interface SOCSOForm8AData {
  year: number;
  month: number;
  employer: {
    name: string;
    socso_code: string;
  };
  employees: SOCSOEmployee[];
  totals: {
    wages: number;
    employee_socso: number;
    employer_socso: number;
    total_socso: number;
  };
  employee_count: number;
}

export interface SOCSOForm8AResponse {
  success: boolean;
  data: SOCSOForm8AData;
}

// PCB CP39 data
export interface PCBEmployee {
  employee_id: string;
  full_name: string;
  ic_no: string;
  tax_no: string;
  gross_salary: number;
  epf_employee: number;
  pcb: number;
}

export interface PCBCP39Data {
  year: number;
  month: number;
  employer: {
    name: string;
    e_file_no: string;
  };
  employees: PCBEmployee[];
  totals: {
    gross_salary: number;
    epf_employee: number;
    pcb: number;
  };
  employee_count: number;
}

export interface PCBCP39Response {
  success: boolean;
  data: PCBCP39Data;
}

// Report type for navigation
export type ReportType = 'ea' | 'epf' | 'socso' | 'pcb';

export interface ReportTypeInfo {
  id: ReportType;
  name: string;
  description: string;
  frequency: 'Monthly' | 'Annual';
  icon: ZardIcon;
}

export const REPORT_TYPES: ReportTypeInfo[] = [
  {
    id: 'ea',
    name: 'EA Form',
    description: 'Annual Employee Remuneration Statement',
    frequency: 'Annual',
    icon: 'file-text'
  },
  {
    id: 'epf',
    name: 'EPF Borang A',
    description: 'Monthly EPF Contribution Statement',
    frequency: 'Monthly',
    icon: 'users'
  },
  {
    id: 'socso',
    name: 'SOCSO Form 8A',
    description: 'Monthly SOCSO Contribution Statement',
    frequency: 'Monthly',
    icon: 'shield'
  },
  {
    id: 'pcb',
    name: 'PCB CP39',
    description: 'Monthly Tax Deduction Statement',
    frequency: 'Monthly',
    icon: 'receipt-text'
  }
];

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];
