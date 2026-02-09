import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// ZardUI Components
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';

import { DashboardService, StaffDashboardData } from '../../services/dashboard.service';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardDividerComponent
  ],
  templateUrl: './staff-dashboard.component.html',
  styleUrls: ['./staff-dashboard.component.css']
})
export class StaffDashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private timerInterval: any;

  loading = signal(true);
  error = signal<string | null>(null);

  currentTime = new Date();
  isClockedIn = false;
  clockInTime: Date | null = null;
  workingHours = '0h 00m';

  leaveBalance: StaffDashboardData['leaveBalance'] = [];
  attendanceHistory: StaffDashboardData['attendanceHistory'] = [];
  myClaims: StaffDashboardData['myClaims'] = [];
  recentMemos: StaffDashboardData['recentMemos'] = [];
  upcomingLeaves: StaffDashboardData['upcomingLeaves'] = [];

  ngOnInit(): void {
    this.loadDashboard();

    // Update time every second
    this.timerInterval = setInterval(() => {
      this.currentTime = new Date();
      if (this.isClockedIn && this.clockInTime) {
        const diff = this.currentTime.getTime() - this.clockInTime.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        this.workingHours = `${hours}h ${minutes.toString().padStart(2, '0')}m`;
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getStaffDashboard().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const d = response.data;

          // Set clock in/out status from today's attendance
          if (d.todayAttendance) {
            this.isClockedIn = d.todayAttendance.isClockedIn;
            this.clockInTime = d.todayAttendance.clockInTime ? new Date(d.todayAttendance.clockInTime) : null;
          }

          this.leaveBalance = d.leaveBalance;
          this.attendanceHistory = d.attendanceHistory;
          this.myClaims = d.myClaims;
          this.upcomingLeaves = d.upcomingLeaves;
          this.recentMemos = d.recentMemos;
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load staff dashboard:', err);
        this.error.set('Failed to load dashboard data. Please try again.');
        this.loading.set(false);
      }
    });
  }

  clockIn(): void {
    this.isClockedIn = true;
    this.clockInTime = new Date();
  }

  clockOut(): void {
    this.isClockedIn = false;
    console.log('Clocked out at', new Date());
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'On Time': 'badge-light-success',
      'Late': 'badge-light-warning',
      'Early Leave': 'badge-light-info',
      'WFH': 'badge-light-info',
      'Pending': 'badge-light-warning',
      'Approved': 'badge-light-success',
      'Rejected': 'badge-light-danger',
      'Paid': 'badge-light-primary',
      'Manager_Approved': 'badge-light-info',
      'Finance_Approved': 'badge-light-success'
    };
    return statusMap[status] || 'badge-light-secondary';
  }

  getProgressPercentage(leave: any): number {
    if (leave.total === 0) return 0;
    return ((leave.used + leave.pending) / leave.total) * 100;
  }

  getUnreadMemosCount(): number {
    return this.recentMemos.filter(m => !m.read).length;
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
