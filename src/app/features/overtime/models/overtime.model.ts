export type OvertimeStatus = 'Pending' | 'Approved' | 'Rejected';
export type OvertimeDayType = 'normal' | 'rest_day' | 'public_holiday';
export type OvertimeSource = 'manual' | 'attendance';

export interface Overtime {
  id: number;
  public_id?: string;
  company_id: number;
  employee_id: number;
  date: string;
  period_year: number;
  period_month: number;
  day_type: OvertimeDayType;
  hours: number | string;
  start_time?: string | null;
  end_time?: string | null;
  multiplier: number | string;
  hourly_rate: number | string;
  amount: number | string;
  reason?: string;
  source: OvertimeSource;
  attendance_id?: number;
  status: OvertimeStatus;
  manager_approved_by?: number;
  manager_approved_at?: string;
  rejection_reason?: string;
  payroll_id?: number;
  created_at: string;
  updated_at: string;
  employee?: OvertimeEmployee;
  approver?: OvertimeUser;
}

export interface OvertimeEmployee {
  id: number;
  full_name: string;
  employee_id: string;
  department?: string;
}

export interface OvertimeUser {
  id: number;
  email: string;
  role: string;
}

export interface SubmitOvertimeRequest {
  employee_id?: number | string;
  date: string;
  hours: number;
  start_time?: string;
  end_time?: string;
  day_type?: OvertimeDayType;
  reason?: string;
  source?: OvertimeSource;
  attendance_id?: number;
}

export interface UpdateOvertimeRequest {
  date?: string;
  hours?: number;
  day_type?: OvertimeDayType;
  reason?: string;
}

export interface OvertimeApprovalRequest {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface OvertimeQueryParams {
  page?: number;
  limit?: number;
  status?: OvertimeStatus;
  year?: number;
  month?: number;
  employee_id?: number | string;
  sort?: 'date' | 'amount' | 'status' | 'created_at';
  order?: 'asc' | 'desc';
}

export interface DayTypeSuggestion {
  date: string;
  day_type: OvertimeDayType;
  multiplier: number;
}

export interface AttendanceSuggestion {
  attendance_id: number | null;
  total_hours: number | null;
  suggested_hours: number;
}

export interface ApprovedOvertimeTotal {
  employee_id: number | string;
  year: number;
  month: number;
  total: number;
}

export const DAY_TYPE_LABELS: Record<OvertimeDayType, string> = {
  normal: 'Normal day (1.5×)',
  rest_day: 'Rest day (2.0×)',
  public_holiday: 'Public holiday (3.0×)'
};

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
