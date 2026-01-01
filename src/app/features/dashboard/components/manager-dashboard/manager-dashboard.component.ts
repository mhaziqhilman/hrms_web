import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardDividerComponent,
    ZardAvatarComponent
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit {
  // Team Stats
  teamStats = {
    totalMembers: 12,
    presentToday: 10,
    onLeave: 2,
    wfhToday: 3
  };

  // Pending Approvals
  pendingApprovals = {
    leaves: 3,
    claims: 5,
    wfh: 2
  };

  // Team Attendance
  teamAttendance = [
    { name: 'Ahmad bin Ali', status: 'Present', clockIn: '08:45 AM', clockOut: '-', hours: '3h 15m' },
    { name: 'Sarah Lee', status: 'WFH', clockIn: '09:00 AM', clockOut: '-', hours: '3h 00m' },
    { name: 'Kumar a/l Rajan', status: 'Present', clockIn: '09:15 AM', clockOut: '-', hours: '2h 45m', late: true },
    { name: 'Fatimah binti Hassan', status: 'On Leave', clockIn: '-', clockOut: '-', hours: '-' },
    { name: 'Wong Mei Ling', status: 'Present', clockIn: '08:30 AM', clockOut: '-', hours: '3h 30m' }
  ];

  // Leave Approvals Pending
  leavePendingApproval = [
    { employee: 'Ahmad bin Ali', type: 'Annual Leave', from: '2025-12-10', to: '2025-12-12', days: 3, reason: 'Family trip', status: 'Pending' },
    { employee: 'Kumar a/l Rajan', type: 'Medical Leave', from: '2025-12-05', to: '2025-12-05', days: 1, reason: 'Doctor appointment', status: 'Pending' },
    { employee: 'Sarah Lee', type: 'Annual Leave', from: '2025-12-15', to: '2025-12-17', days: 3, reason: 'Personal matters', status: 'Pending' }
  ];

  // Claims Pending Approval
  claimsPendingApproval = [
    { employee: 'Wong Mei Ling', type: 'Travel', amount: 85.50, date: '2025-11-28', description: 'Client meeting - Penang', status: 'Pending' },
    { employee: 'Ahmad bin Ali', type: 'Medical', amount: 120.00, date: '2025-11-29', description: 'Clinic visit', status: 'Pending' },
    { employee: 'Fatimah binti Hassan', type: 'Meal', amount: 45.00, date: '2025-11-30', description: 'Overtime dinner', status: 'Pending' }
  ];

  // WFH Requests
  wfhRequests = [
    { employee: 'Sarah Lee', date: '2025-12-05', reason: 'Home renovation', status: 'Pending' },
    { employee: 'Kumar a/l Rajan', date: '2025-12-08', reason: 'Childcare', status: 'Pending' }
  ];

  ngOnInit(): void {
    // Initialize data
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Present': 'badge-light-success',
      'WFH': 'badge-light-info',
      'On Leave': 'badge-light-warning',
      'Absent': 'badge-light-danger',
      'Pending': 'badge-light-warning',
      'Approved': 'badge-light-success',
      'Rejected': 'badge-light-danger'
    };
    return statusMap[status] || 'badge-light-secondary';
  }

  approveLeave(leave: any): void {
    console.log('Approving leave for', leave.employee);
  }

  rejectLeave(leave: any): void {
    console.log('Rejecting leave for', leave.employee);
  }

  approveClaim(claim: any): void {
    console.log('Approving claim for', claim.employee);
  }

  rejectClaim(claim: any): void {
    console.log('Rejecting claim for', claim.employee);
  }
}
