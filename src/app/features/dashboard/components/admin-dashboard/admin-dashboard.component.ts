import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';

import { DashboardService, AdminDashboardData } from '../../services/dashboard.service';

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
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);

  payrollSummary = {
    status: '-',
    totalEmployees: 0,
    totalGrossSalary: 0,
    totalStatutory: 0,
    totalPCB: 0,
    totalNetSalary: 0
  };

  employeeStats = {
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    newHires: 0
  };

  attendanceSummary = {
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    wfhToday: 0,
    attendanceRate: 0
  };

  claimsPendingPayment: AdminDashboardData['claimsPendingPayment'] = [];
  recentLeaveRequests: AdminDashboardData['recentLeaveRequests'] = [];
  recentActivities: AdminDashboardData['recentActivities'] = [];
  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getAdminDashboard().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const d = response.data;
          this.employeeStats = d.employeeStats;
          this.attendanceSummary = d.attendanceSummary;
          this.payrollSummary = d.payrollSummary;
          this.claimsPendingPayment = d.claimsPendingPayment;
          this.recentLeaveRequests = d.recentLeaveRequests;
          this.recentActivities = d.recentActivities;
          this.currentMonth = d.currentMonth;
          this.currentYear = d.currentYear;
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load admin dashboard:', err);
        this.error.set('Failed to load dashboard data. Please try again.');
        this.loading.set(false);
      }
    });
  }

  getMonthName(month: number): string {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month] || '';
  }

  getTimeAgo(time: string): string {
    if (!time) return '';
    const now = new Date();
    const then = new Date(time);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Not Started': 'badge-light-warning',
      'In Progress': 'badge-light-info',
      'Draft': 'badge-light-secondary',
      'Pending': 'badge-light-warning',
      'Approved': 'badge-light-success',
      'Paid': 'badge-light-success',
      'Manager Approved': 'badge-light-info',
      'Rejected': 'badge-light-danger'
    };
    return statusMap[status] || 'badge-light-secondary';
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
