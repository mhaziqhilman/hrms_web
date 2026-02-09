import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Admin Dashboard Types
export interface AdminDashboardData {
  employeeStats: {
    totalEmployees: number;
    activeEmployees: number;
    onLeave: number;
    newHires: number;
  };
  attendanceSummary: {
    presentToday: number;
    lateToday: number;
    absentToday: number;
    wfhToday: number;
    attendanceRate: number;
  };
  payrollSummary: {
    status: string;
    totalEmployees: number;
    totalGrossSalary: number;
    totalStatutory: number;
    totalPCB: number;
    totalNetSalary: number;
  };
  claimsPendingPayment: {
    id: number;
    employee: string;
    type: string;
    amount: number;
    date: string;
    status: string;
  }[];
  recentLeaveRequests: {
    id: number;
    employee: string;
    type: string;
    from: string;
    to: string;
    days: number;
    status: string;
  }[];
  recentActivities: {
    action: string;
    time: string;
    icon: string;
    color: string;
  }[];
  currentMonth: number;
  currentYear: number;
}

// Manager Dashboard Types
export interface ManagerDashboardData {
  teamStats: {
    totalMembers: number;
    presentToday: number;
    onLeave: number;
    wfhToday: number;
  };
  pendingApprovals: {
    leaves: number;
    claims: number;
    wfh: number;
  };
  teamAttendance: {
    name: string;
    status: string;
    clockIn: string;
    clockOut: string;
    hours: string;
    late: boolean;
  }[];
  leavePendingApproval: {
    id: number;
    employee: string;
    type: string;
    from: string;
    to: string;
    days: number;
    reason: string;
    status: string;
  }[];
  claimsPendingApproval: {
    id: number;
    employee: string;
    type: string;
    amount: number;
    date: string;
    description: string;
    status: string;
  }[];
  wfhRequests: {
    id: number;
    employee: string;
    date: string;
    reason: string;
    status: string;
  }[];
}

// Staff Dashboard Types
export interface StaffDashboardData {
  todayAttendance: {
    isClockedIn: boolean;
    clockInTime: string | null;
    clockOutTime: string | null;
    type: string | null;
  };
  leaveBalance: {
    type: string;
    total: number;
    used: number;
    pending: number;
    available: number;
    color: string;
  }[];
  attendanceHistory: {
    date: string;
    clockIn: string;
    clockOut: string;
    hours: string;
    status: string;
  }[];
  myClaims: {
    id: number;
    type: string;
    amount: number;
    date: string;
    description: string;
    status: string;
    receipt: boolean;
  }[];
  upcomingLeaves: {
    id: number;
    type: string;
    from: string;
    to: string;
    days: number;
    status: string;
  }[];
  recentMemos: {
    id: number;
    title: string;
    date: string;
    urgent: boolean;
    read: boolean;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  getAdminDashboard(): Observable<ApiResponse<AdminDashboardData>> {
    return this.http.get<ApiResponse<AdminDashboardData>>(
      `${this.apiUrl}${API_CONFIG.endpoints.dashboard.admin}`
    );
  }

  getManagerDashboard(): Observable<ApiResponse<ManagerDashboardData>> {
    return this.http.get<ApiResponse<ManagerDashboardData>>(
      `${this.apiUrl}${API_CONFIG.endpoints.dashboard.manager}`
    );
  }

  getStaffDashboard(): Observable<ApiResponse<StaffDashboardData>> {
    return this.http.get<ApiResponse<StaffDashboardData>>(
      `${this.apiUrl}${API_CONFIG.endpoints.dashboard.staff}`
    );
  }
}
