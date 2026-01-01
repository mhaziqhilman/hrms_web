export interface Attendance {
  id: number;
  employee_id: number;
  clock_in_time: string;
  clock_out_time?: string;
  type: 'Office' | 'WFH';
  clock_in_location_lat?: number;
  clock_in_location_long?: number;
  clock_in_location_address?: string;
  clock_out_location_lat?: number;
  clock_out_location_long?: number;
  clock_out_location_address?: string;
  total_hours?: number;
  is_late: boolean;
  is_early_leave: boolean;
  late_minutes?: number;
  early_leave_minutes?: number;
  remarks?: string;
  created_at: string;
  updated_at: string;
  employee?: AttendanceEmployee;
}

export interface AttendanceEmployee {
  id: number;
  full_name: string;
  employee_code: string;
}

export interface WFHApplication {
  id: number;
  employee_id: number;
  date: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approver_id?: number;
  approved_at?: string | null;
  approver_name?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  employee?: AttendanceEmployee;
  approver?: {
    id: number;
    email: string;
    role: string;
  };
}

export interface AttendanceSummary {
  employee_id: number;
  employee_name: string;
  period: string;
  total_days: number;
  office_days: number;
  wfh_days: number;
  late_count: number;
  early_leave_count: number;
  total_work_hours: number;
  avg_daily_hours: number;
}

export interface ClockInRequest {
  employee_id: number;
  type?: 'Office' | 'WFH';
  location_lat?: number;
  location_long?: number;
  location_address?: string;
}

export interface ClockOutRequest {
  employee_id: number;
  location_lat?: number;
  location_long?: number;
  location_address?: string;
}

export interface WFHApplicationRequest {
  employee_id: number;
  date: string;
  reason: string;
}

export interface AttendanceQueryParams {
  page?: number;
  limit?: number;
  employee_id?: number;
  type?: 'Office' | 'WFH';
  start_date?: string;
  end_date?: string;
  is_late?: boolean;
  is_early_leave?: boolean;
}

export interface WFHQueryParams {
  page?: number;
  limit?: number;
  employee_id?: number;
  status?: 'Pending' | 'Approved' | 'Rejected';
  start_date?: string;
  end_date?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
