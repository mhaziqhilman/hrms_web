import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';

import { DashboardService, ManagerDashboardData } from '../../services/dashboard.service';

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
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);

  teamStats = {
    totalMembers: 0,
    presentToday: 0,
    onLeave: 0,
    wfhToday: 0
  };

  pendingApprovals = {
    leaves: 0,
    claims: 0,
    wfh: 0
  };

  teamAttendance: ManagerDashboardData['teamAttendance'] = [];
  leavePendingApproval: ManagerDashboardData['leavePendingApproval'] = [];
  claimsPendingApproval: ManagerDashboardData['claimsPendingApproval'] = [];
  wfhRequests: ManagerDashboardData['wfhRequests'] = [];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getManagerDashboard().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const d = response.data;
          this.teamStats = d.teamStats;
          this.pendingApprovals = d.pendingApprovals;
          this.teamAttendance = d.teamAttendance;
          this.leavePendingApproval = d.leavePendingApproval;
          this.claimsPendingApproval = d.claimsPendingApproval;
          this.wfhRequests = d.wfhRequests;
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load manager dashboard:', err);
        this.error.set('Failed to load dashboard data. Please try again.');
        this.loading.set(false);
      }
    });
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
    this.router.navigate(['/leave'], { queryParams: { action: 'approve', id: leave.id } });
  }

  rejectLeave(leave: any): void {
    this.router.navigate(['/leave'], { queryParams: { action: 'reject', id: leave.id } });
  }

  approveClaim(claim: any): void {
    this.router.navigate(['/claims'], { queryParams: { action: 'approve', id: claim.id } });
  }

  rejectClaim(claim: any): void {
    this.router.navigate(['/claims'], { queryParams: { action: 'reject', id: claim.id } });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
