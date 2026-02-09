// Analytics Models

export interface PayrollCostAnalytics {
  year: number;
  period: {
    startMonth: number;
    endMonth: number;
  };
  summary: PayrollSummary;
  by_month: PayrollMonthData[];
  by_department: PayrollDepartmentData[];
}

export interface PayrollSummary {
  total_gross: number;
  total_net: number;
  total_epf: number;
  total_socso: number;
  total_eis: number;
  total_pcb: number;
  employee_count: number;
}

export interface PayrollMonthData {
  month: number;
  total_gross: number;
  total_net: number;
  total_epf_employee: number;
  total_epf_employer: number;
  total_socso_employee: number;
  total_socso_employer: number;
  total_eis_employee: number;
  total_eis_employer: number;
  total_pcb: number;
  employee_count: number;
}

export interface PayrollDepartmentData {
  department: string;
  total_gross: number;
  total_net: number;
  employee_count: number;
}

export interface LeaveUtilizationAnalytics {
  year: number;
  summary: {
    total_days_taken: number;
    total_requests: number;
  };
  by_type: LeaveTypeData[];
  by_month: LeaveMonthData[];
  by_department: LeaveDepartmentData[];
  by_status: LeaveStatusData[];
}

export interface LeaveTypeData {
  leave_type: string;
  total_days: number;
  request_count: number;
}

export interface LeaveMonthData {
  month: number;
  total_days: number;
  request_count: number;
}

export interface LeaveDepartmentData {
  department: string;
  total_days: number;
  request_count: number;
}

export interface LeaveStatusData {
  status: string;
  count: number;
}

export interface AttendancePunctualityAnalytics {
  year: number;
  month: number | null;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: AttendanceSummary;
  by_department: AttendanceDepartmentData[];
  trend: AttendanceTrendData[];
  by_work_type: WorkTypeData[];
}

export interface AttendanceSummary {
  total_records: number;
  late_count: number;
  early_leave_count: number;
  punctuality_rate: number;
  avg_late_minutes: string;
  avg_working_hours: string;
}

export interface AttendanceDepartmentData {
  department: string;
  total_records: number;
  late_count: number;
  punctuality_rate: number;
  avg_working_hours: string;
}

export interface AttendanceTrendData {
  date?: string;
  month?: number;
  total_records: number;
  late_count: number;
  avg_working_hours?: string;
}

export interface WorkTypeData {
  type: string;
  count: number;
}

export interface ClaimsSpendingAnalytics {
  year: number;
  summary: ClaimsSummary;
  by_type: ClaimTypeData[];
  by_month: ClaimMonthData[];
  by_department: ClaimDepartmentData[];
  by_status: ClaimStatusData[];
}

export interface ClaimsSummary {
  total_amount: number;
  total_claims: number;
  avg_claim_amount: number;
}

export interface ClaimTypeData {
  claim_type: string;
  total_amount: number;
  claim_count: number;
  avg_amount: string;
}

export interface ClaimMonthData {
  month: number;
  total_amount: number;
  claim_count: number;
}

export interface ClaimDepartmentData {
  department: string;
  total_amount: number;
  claim_count: number;
}

export interface ClaimStatusData {
  status: string;
  count: number;
  total_amount: number;
}

export interface DashboardSummary {
  year: number;
  month: number;
  payroll: {
    total_gross: number;
    total_net: number;
    processed_count: number;
  };
  employees: {
    active_count: number;
  };
  leave: {
    approved_count: number;
  };
  claims: {
    pending_count: number;
  };
  attendance: {
    total_records: number;
    late_count: number;
    punctuality_rate: number;
  };
}

// API Response types
export interface PayrollCostAnalyticsResponse {
  success: boolean;
  data: PayrollCostAnalytics;
}

export interface LeaveUtilizationAnalyticsResponse {
  success: boolean;
  data: LeaveUtilizationAnalytics;
}

export interface AttendancePunctualityAnalyticsResponse {
  success: boolean;
  data: AttendancePunctualityAnalytics;
}

export interface ClaimsSpendingAnalyticsResponse {
  success: boolean;
  data: ClaimsSpendingAnalytics;
}

export interface DashboardSummaryResponse {
  success: boolean;
  data: DashboardSummary;
}

// Chart configuration types
export type AnalyticsType = 'payroll' | 'leave' | 'attendance' | 'claims';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
