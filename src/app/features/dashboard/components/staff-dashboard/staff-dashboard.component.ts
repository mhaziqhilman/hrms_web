import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// ZardUI Components
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';

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
export class StaffDashboardComponent implements OnInit {
  currentTime = new Date();
  isClockedIn = false;
  clockInTime: Date | null = null;
  workingHours = '0h 00m';

  // Leave Balance
  leaveBalance = [
    { type: 'Annual Leave', total: 14, used: 5, pending: 3, available: 6, color: 'primary' },
    { type: 'Medical Leave', total: 14, used: 2, pending: 1, available: 11, color: 'success' },
    { type: 'Emergency Leave', total: 5, used: 1, pending: 0, available: 4, color: 'warning' },
    { type: 'Unpaid Leave', total: 0, used: 0, pending: 0, available: 0, color: 'danger' }
  ];

  // Attendance History
  attendanceHistory = [
    { date: '2025-12-01', clockIn: '08:45 AM', clockOut: '06:00 PM', hours: '9h 15m', status: 'On Time' },
    { date: '2025-11-30', clockIn: '09:15 AM', clockOut: '06:30 PM', hours: '9h 15m', status: 'Late' },
    { date: '2025-11-29', clockIn: '08:30 AM', clockOut: '05:45 PM', hours: '9h 15m', status: 'On Time' },
    { date: '2025-11-28', clockIn: '08:50 AM', clockOut: '06:10 PM', hours: '9h 20m', status: 'On Time' },
    { date: '2025-11-27', clockIn: '09:00 AM', clockOut: '06:00 PM', hours: '9h 00m', status: 'On Time' }
  ];

  // My Claims
  myClaims = [
    { type: 'Medical', amount: 150.00, date: '2025-11-25', description: 'Clinic visit', status: 'Approved', receipt: true },
    { type: 'Travel', amount: 85.50, date: '2025-11-20', description: 'Client meeting - KL', status: 'Paid', receipt: true },
    { type: 'Meal', amount: 45.00, date: '2025-11-18', description: 'Overtime dinner', status: 'Pending', receipt: true }
  ];

  // Recent Memos
  recentMemos = [
    { title: 'Public Holiday - Prophet Muhammad Birthday', date: '2025-11-28', urgent: true, read: false },
    { title: 'Year-End Company Dinner 2025', date: '2025-11-25', urgent: false, read: false },
    { title: 'Updated Leave Policy 2026', date: '2025-11-20', urgent: false, read: true }
  ];

  // Upcoming Leaves
  upcomingLeaves = [
    { type: 'Annual Leave', from: '2025-12-20', to: '2025-12-22', days: 3, status: 'Approved' },
    { type: 'Medical Leave', from: '2025-12-05', to: '2025-12-05', days: 1, status: 'Pending' }
  ];

  ngOnInit(): void {
    // Update time every second
    setInterval(() => {
      this.currentTime = new Date();
      if (this.isClockedIn && this.clockInTime) {
        const diff = this.currentTime.getTime() - this.clockInTime.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        this.workingHours = `${hours}h ${minutes.toString().padStart(2, '0')}m`;
      }
    }, 1000);
  }

  clockIn(): void {
    this.isClockedIn = true;
    this.clockInTime = new Date();
  }

  clockOut(): void {
    this.isClockedIn = false;
    // Add to attendance history
    console.log('Clocked out at', new Date());
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'On Time': 'badge-light-success',
      'Late': 'badge-light-warning',
      'Early Leave': 'badge-light-info',
      'Pending': 'badge-light-warning',
      'Approved': 'badge-light-success',
      'Rejected': 'badge-light-danger',
      'Paid': 'badge-light-primary'
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
}
