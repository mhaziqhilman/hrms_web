import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardDividerComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  // Payroll Summary
  payrollSummary = {
    status: 'Not Started',
    totalEmployees: 45,
    totalGrossSalary: 185000,
    totalStatutory: 35420,
    totalPCB: 12500,
    totalNetSalary: 137080
  };

  // Employee Stats
  employeeStats = {
    totalEmployees: 45,
    activeEmployees: 42,
    onLeave: 3,
    newHires: 2
  };

  // Attendance Summary
  attendanceSummary = {
    presentToday: 38,
    lateToday: 4,
    absentToday: 3,
    wfhToday: 5,
    attendanceRate: 89.5
  };

  // Claims Pending Payment
  claimsPendingPayment = [
    { employee: 'Ahmad bin Ali', type: 'Medical', amount: 150.00, date: '2025-11-25', status: 'Approved' },
    { employee: 'Sarah Lee', type: 'Travel', amount: 245.50, date: '2025-11-26', status: 'Approved' },
    { employee: 'Kumar a/l Rajan', type: 'Meal', amount: 85.00, date: '2025-11-27', status: 'Approved' }
  ];

  // Leave Requests
  recentLeaveRequests = [
    { employee: 'Fatimah binti Hassan', type: 'Annual Leave', from: '2025-12-05', to: '2025-12-07', days: 3, status: 'Pending' },
    { employee: 'Wong Mei Ling', type: 'Medical Leave', from: '2025-12-02', to: '2025-12-02', days: 1, status: 'Pending' }
  ];

  // Recent Activities
  recentActivities = [
    { action: 'Payroll processed for November 2025', time: '2 hours ago', icon: 'cash-stack', color: 'success' },
    { action: '3 new leave requests submitted', time: '4 hours ago', icon: 'calendar-check', color: 'info' },
    { action: '5 claims approved by managers', time: '1 day ago', icon: 'receipt', color: 'primary' },
    { action: 'New employee onboarded', time: '2 days ago', icon: 'person-plus', color: 'warning' }
  ];

  ngOnInit(): void {
    // Initialize data
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Not Started': 'badge-light-warning',
      'In Progress': 'badge-light-info',
      'Locked': 'badge-light-primary',
      'Paid': 'badge-light-success',
      'Pending': 'badge-light-warning',
      'Approved': 'badge-light-success',
      'Rejected': 'badge-light-danger'
    };
    return statusMap[status] || 'badge-light-secondary';
  }
}
