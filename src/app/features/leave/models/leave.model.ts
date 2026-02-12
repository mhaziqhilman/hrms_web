export interface Leave {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day: boolean;
  half_day_period?: 'AM' | 'PM';
  reason: string;
  attachment_url?: string;
  status: LeaveStatus;
  approver_id?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  employee?: LeaveEmployee;
  leave_type?: LeaveType;
  approver?: LeaveUser;
}

export interface LeaveEmployee {
  id: number;
  employee_id: string;
  full_name: string;
  department: string;
  position: string;
  reporting_manager_id?: number;
}

export interface LeaveUser {
  id: number;
  email: string;
  role: string;
}

export interface LeaveType {
  id: number;
  name: string;
  days_per_year: number;
  is_paid: boolean;
  carry_forward_allowed: boolean;
  carry_forward_max_days: number;
  prorate_for_new_joiners: boolean;
  requires_document: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveEntitlement {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  balance_days: number;
  carry_forward_days: number;
  created_at: string;
  updated_at: string;
  leave_type?: LeaveType;
  employee?: LeaveEmployee;
}

export interface LeaveEntitlementListParams {
  page?: number;
  limit?: number;
  year?: number;
  employee_id?: number;
  leave_type_id?: number;
  search?: string;
}

export interface LeaveEntitlementListResponse {
  success: boolean;
  data: {
    entitlements: LeaveEntitlement[];
    pagination: {
      total: number;
      currentPage: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface LeaveEntitlementResponse {
  success: boolean;
  data: LeaveEntitlement;
  message?: string;
}

export interface CreateLeaveEntitlementRequest {
  employee_id: number;
  leave_type_id: number;
  year: number;
  total_days: number;
  carry_forward_days?: number;
}

export interface UpdateLeaveEntitlementRequest {
  total_days?: number;
  carry_forward_days?: number;
}

export interface InitializeYearResponse {
  success: boolean;
  data: {
    year: number;
    created: number;
    skipped: number;
    total_employees: number;
    total_leave_types: number;
  };
  message?: string;
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled'
}

export interface LeaveListParams {
  page?: number;
  limit?: number;
  status?: LeaveStatus;
  employee_id?: number;
  leave_type_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface LeaveListResponse {
  success: boolean;
  data: {
    leaves: Leave[];
    pagination: {
      total: number;
      currentPage: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface LeaveResponse {
  success: boolean;
  data: Leave;
  message?: string;
}

export interface ApplyLeaveRequest {
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  half_day_period?: 'AM' | 'PM';
  reason: string;
  attachment_url?: string;
}

export interface UpdateLeaveRequest {
  start_date?: string;
  end_date?: string;
  is_half_day?: boolean;
  half_day_period?: 'AM' | 'PM';
  reason?: string;
  attachment_url?: string;
}

export interface ApproveRejectLeaveRequest {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface LeaveBalanceResponse {
  success: boolean;
  data: {
    employee: {
      id: number;
      employee_id: string;
      full_name: string;
    };
    year: number;
    entitlements: Array<{
      leave_type: LeaveType;
      total_days: number;
      used_days: number;
      pending_days: number;
      balance_days: number;
      carry_forward_days: number;
    }>;
  };
}

export const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  [LeaveStatus.PENDING]: 'warning',
  [LeaveStatus.APPROVED]: 'success',
  [LeaveStatus.REJECTED]: 'danger',
  [LeaveStatus.CANCELLED]: 'secondary'
};

export const LEAVE_STATUS_ICONS: Record<LeaveStatus, string> = {
  [LeaveStatus.PENDING]: 'bi-clock-history',
  [LeaveStatus.APPROVED]: 'bi-check-circle',
  [LeaveStatus.REJECTED]: 'bi-x-circle',
  [LeaveStatus.CANCELLED]: 'bi-slash-circle'
};

export const DEFAULT_LEAVE_TYPES = [
  'Annual Leave',
  'Medical Leave',
  'Hospitalization Leave',
  'Unpaid Leave',
  'Emergency Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Study Leave',
  'Replacement Leave'
];
