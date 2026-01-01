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
  created_at: string;
  updated_at: string;
  employee?: Employee | null;
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
