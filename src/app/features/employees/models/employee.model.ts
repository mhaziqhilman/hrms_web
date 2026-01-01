export type Gender = 'Male' | 'Female';
export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';
export type EmploymentType = 'Permanent' | 'Contract' | 'Probation' | 'Intern';
export type EmploymentStatus = 'Active' | 'Resigned' | 'Terminated';

export interface Employee {
  id: number;
  user_id?: number;

  // Employee Information
  employee_id: string;
  full_name: string;
  ic_no?: string;
  passport_no?: string;
  date_of_birth?: string;
  gender: Gender;
  marital_status?: MaritalStatus;
  nationality?: string;
  race?: string;
  religion?: string;

  // Contact Information
  mobile?: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  current_address?: string;
  permanent_address?: string;

  // Employment Information
  position?: string;
  department?: string;
  reporting_manager_id?: number;
  manager?: EmployeeBasicInfo; // For populated manager data
  basic_salary: number;
  join_date: string;
  confirmation_date?: string;
  employment_type?: EmploymentType;
  employment_status?: EmploymentStatus;
  work_location?: string;

  // Banking Information
  bank_name?: string;
  bank_account_no?: string;
  bank_account_holder?: string;

  // Statutory Information
  epf_no?: string;
  socso_no?: string;
  tax_no?: string;
  tax_category?: string;

  // Profile
  photo_url?: string;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeBasicInfo {
  id: number;
  employee_id: string;
  full_name: string;
  position?: string;
}

export interface CreateEmployeeRequest {
  employee_id: string;
  full_name: string;
  ic_no?: string;
  passport_no?: string;
  date_of_birth?: string;
  gender: Gender;
  marital_status?: MaritalStatus;
  nationality?: string;
  race?: string;
  religion?: string;
  mobile?: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  current_address?: string;
  permanent_address?: string;
  position?: string;
  department?: string;
  reporting_manager_id?: number;
  basic_salary: number;
  join_date: string;
  confirmation_date?: string;
  employment_type?: EmploymentType;
  work_location?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_account_holder?: string;
  epf_no?: string;
  socso_no?: string;
  tax_no?: string;
  tax_category?: string;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  employment_status?: EmploymentStatus;
}

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: EmploymentStatus;
  employment_type?: EmploymentType;
  department?: string;
}

export interface EmployeeListResponse {
  success: boolean;
  data: {
    employees: Employee[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  };
}

export interface EmployeeYTD {
  year: number;
  employee_id: number;
  employee_name: string;
  totals: {
    gross_pay: number;
    epf_employee: number;
    epf_employer: number;
    socso_employee: number;
    socso_employer: number;
    eis_employee: number;
    eis_employer: number;
    pcb: number;
    net_pay: number;
  };
  monthly_breakdown: Array<{
    month: number;
    month_name: string;
    gross_pay: number;
    epf_employee: number;
    epf_employer: number;
    socso_employee: number;
    socso_employer: number;
    eis_employee: number;
    eis_employer: number;
    pcb: number;
    net_pay: number;
  }>;
}

export interface EmployeeStatistics {
  total_employees: number;
  active_employees: number;
  by_employment_type: {
    Permanent: number;
    Contract: number;
    Probation: number;
    Intern: number;
  };
  by_department: Record<string, number>;
  recent_joiners: Employee[];
}
