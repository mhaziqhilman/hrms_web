/**
 * Authentication Models
 * TypeScript interfaces for auth-related data structures
 */

export interface User {
  id: number;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  is_active: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  email_verified: boolean;
  company_id: number | null;
  created_at: string;
  updated_at: string;
  employee?: Employee | null;
  company?: Company | null;
  company_memberships?: UserCompany[];
}

export interface UserCompany {
  id: number;
  user_id: number;
  company_id: number;
  role: 'admin' | 'manager' | 'staff';
  employee_id: number | null;
  joined_at: string;
  company?: Company;
}

export interface Employee {
  id: number;
  user_id: number;
  employee_id: string;
  full_name: string;
  ic_no?: string;
  passport_no?: string;
  date_of_birth?: string;
  gender: 'Male' | 'Female';
  marital_status?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  nationality?: string;
  race?: string;
  religion?: string;
  mobile?: string;
  email?: string;
  department?: string;
  position?: string;
  basic_salary: number;
  join_date: string;
  employment_type?: 'Permanent' | 'Contract' | 'Probation' | 'Intern';
  employment_status?: 'Active' | 'Resigned' | 'Terminated';
}

export interface Company {
  id: number;
  name: string;
  registration_no?: string;
  description?: string;
  industry?: string;
  size?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  country?: string;
  address?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: number;
  company_id: number;
  invited_by: number;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at?: string;
  company?: Company;
  inviter?: User;
  created_at: string;
  updated_at: string;
}

export interface CompanySetupRequest {
  company: {
    name: string;
    registration_no?: string;
    description?: string;
    industry?: string;
    size?: string;
    country?: string;
    address?: string;
    phone?: string;
    website?: string;
  };
  initialEmployee?: {
    full_name: string;
    employee_id: string;
    gender: 'Male' | 'Female';
    join_date: string;
    position?: string;
    department?: string;
    basic_salary: number;
    email?: string;
    mobile?: string;
  };
  invitations?: Array<{
    email: string;
    role: 'admin' | 'manager' | 'staff';
  }>;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
