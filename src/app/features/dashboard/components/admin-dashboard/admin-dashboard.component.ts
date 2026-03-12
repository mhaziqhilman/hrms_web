import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardTabGroupComponent, ZardTabComponent } from '@/shared/components/tabs/tabs.component';

import { AuthService } from '@/core/services/auth.service';
import { DashboardService, AdminDashboardData, StaffDashboardData } from '../../services/dashboard.service';
import { StaffDashboardComponent } from '../staff-dashboard/staff-dashboard.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardDividerComponent,
    ZardTabGroupComponent,
    ZardTabComponent,
    StaffDashboardComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = 0;

  @ViewChild('deptChart') deptChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('genderChart') genderChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('employeeTypeChart') employeeTypeChartRef!: ElementRef<HTMLCanvasElement>;

  private deptChartInstance: Chart<'bar'> | null = null;
  private genderChartInstance: Chart<'bar'> | null = null;
  private employeeTypeChartInstance: Chart<'doughnut'> | null = null;
  private chartsInitialized = false;

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
  employeeByType: AdminDashboardData['employeeByType'] = [];
  genderDiversity: AdminDashboardData['genderDiversity'] = [];
  departmentDistribution: AdminDashboardData['departmentDistribution'] = [];
  lastUpdated = '';
  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();

  userName = '';

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();
    this.userName = user?.employee?.full_name || user?.email || 'Admin';
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data loads
  }

  ngOnDestroy(): void {
    this.destroyCharts();
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
          this.employeeByType = d.employeeByType || [];
          this.genderDiversity = d.genderDiversity || [];
          this.departmentDistribution = d.departmentDistribution || [];
          this.lastUpdated = d.lastUpdated || new Date().toISOString();
          this.currentMonth = d.currentMonth;
          this.currentYear = d.currentYear;
        }
        this.loading.set(false);

        // Initialize charts after data is loaded and view has rendered
        setTimeout(() => this.initCharts(), 100);
      },
      error: (err) => {
        console.error('Failed to load admin dashboard:', err);
        this.error.set('Failed to load dashboard data. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onTabChange(event: any): void {
    this.activeTab = event.index;
    if (event.index === 0 && !this.chartsInitialized) {
      setTimeout(() => this.initCharts(), 100);
    }
  }

  private initCharts(): void {
    this.destroyCharts();
    this.initDeptChart();
    this.initGenderChart();
    this.initEmployeeTypeChart();
    this.chartsInitialized = true;
  }

  private destroyCharts(): void {
    this.deptChartInstance?.destroy();
    this.genderChartInstance?.destroy();
    this.employeeTypeChartInstance?.destroy();
    this.deptChartInstance = null;
    this.genderChartInstance = null;
    this.employeeTypeChartInstance = null;
    this.chartsInitialized = false;
  }

  private initDeptChart(): void {
    if (!this.deptChartRef?.nativeElement || this.departmentDistribution.length === 0) return;

    const labels = this.departmentDistribution.map(d => d.department);
    const data = this.departmentDistribution.map(d => d.count);
    const colors = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#a7f3d0', '#6ee7b7', '#34d399'];

    this.deptChartInstance = new Chart(this.deptChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Employees',
          data,
          backgroundColor: colors.slice(0, data.length),
          borderRadius: 6,
          barThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#94a3b8', font: { size: 12 } },
            grid: { color: 'rgba(148,163,184,0.1)' }
          },
          x: {
            ticks: { color: '#94a3b8', font: { size: 11 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  private initGenderChart(): void {
    if (!this.genderChartRef?.nativeElement || this.genderDiversity.length === 0) return;

    const labels = this.genderDiversity.map(g => g.gender);
    const data = this.genderDiversity.map(g => g.count);
    const colors = ['#3b82f6', '#f97316', '#8b5cf6', '#10b981'];

    this.genderChartInstance = new Chart(this.genderChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Count',
          data,
          backgroundColor: colors.slice(0, data.length),
          borderRadius: 4,
          barThickness: 24
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#94a3b8', font: { size: 12 } },
            grid: { color: 'rgba(148,163,184,0.1)' }
          },
          y: {
            ticks: { color: '#94a3b8', font: { size: 12 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  private initEmployeeTypeChart(): void {
    if (!this.employeeTypeChartRef?.nativeElement || this.employeeByType.length === 0) return;

    const labels = this.employeeByType.map(e => e.type);
    const data = this.employeeByType.map(e => e.count);
    const total = data.reduce((a, b) => a + b, 0);
    const colors = ['#0d9488', '#f59e0b', '#8b5cf6', '#ef4444'];

    this.employeeTypeChartInstance = new Chart(this.employeeTypeChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, data.length),
          borderWidth: 0,
          spacing: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#64748b',
              font: { size: 12 }
            }
          }
        }
      },
      plugins: [{
        id: 'centerText',
        beforeDraw(chart: any) {
          const { ctx, width, height } = chart;
          const centerY = height / 2 - 12;
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px Inter, sans-serif';
          ctx.fillText('Total Employee', width / 2, centerY - 14);
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 28px Inter, sans-serif';
          ctx.fillText(total.toString(), width / 2, centerY + 14);
          ctx.restore();
        }
      }]
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

  formatLastUpdated(): string {
    if (!this.lastUpdated) return '';
    const d = new Date(this.lastUpdated);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
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
