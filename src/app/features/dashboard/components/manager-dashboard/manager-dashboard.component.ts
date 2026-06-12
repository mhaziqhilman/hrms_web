import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// ZardUI Components
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardTabGroupComponent, ZardTabComponent } from '@/shared/components/tabs/tabs.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';

import { AuthService } from '@/core/services/auth.service';
import { DashboardService, ManagerDashboardData, WeekData } from '../../services/dashboard.service';
import { StaffDashboardComponent } from '../staff-dashboard/staff-dashboard.component';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardTabGroupComponent,
    ZardTabComponent,
    ZardSkeletonComponent,
    StaffDashboardComponent
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  loadedAt = signal<Date>(new Date());

  /** Week-ahead timeline toggle */
  weekTab = signal<'this' | 'next'>('this');

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
  teamRoster: ManagerDashboardData['teamRoster'] = [];
  weekAhead: ManagerDashboardData['weekAhead'] = {
    thisWeek: { rangeLabel: '', days: [] },
    nextWeek: { rangeLabel: '', days: [] },
    coverageNote: 'No planned leave this week — full coverage'
  };
  teamPulse: ManagerDashboardData['teamPulse'] = { attendanceRate: 0, onTimeRate: 0, decisions: 0 };
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
          // Treat the V2-only fields as optional so the page degrades
          // gracefully if the frontend deploys ahead of the backend.
          const d = response.data as Omit<
            ManagerDashboardData,
            'teamRoster' | 'weekAhead' | 'teamPulse'
          > & Partial<Pick<ManagerDashboardData, 'teamRoster' | 'weekAhead' | 'teamPulse'>>;
          this.teamStats = d.teamStats;
          this.pendingApprovals = d.pendingApprovals;
          this.teamAttendance = d.teamAttendance;
          this.teamRoster = d.teamRoster ?? [];
          this.weekAhead = d.weekAhead ?? this.weekAhead;
          this.teamPulse = d.teamPulse ?? this.teamPulse;
          this.leavePendingApproval = d.leavePendingApproval;
          this.claimsPendingApproval = d.claimsPendingApproval;
          this.wfhRequests = d.wfhRequests;
        }
        this.loadedAt.set(new Date());
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load manager dashboard:', err);
        this.error.set('Failed to load dashboard data. Please try again.');
        this.loading.set(false);
      }
    });
  }

  // ─── Editorial hero helpers ─────────────────────────────────
  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  get managerFirstName(): string {
    const user = this.authService.getCurrentUserValue();
    const name = user?.employee?.full_name?.trim();
    return name ? name.split(/\s+/)[0] : 'there';
  }

  get dateLabel(): string {
    const d = new Date();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const rest = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${weekday} · ${rest}`.toUpperCase();
  }

  // ─── Derived counts ─────────────────────────────────────────
  get inOffice(): number {
    return Math.max(0, this.teamStats.presentToday - this.teamStats.wfhToday);
  }

  get notInYet(): number {
    return Math.max(
      0,
      this.teamStats.totalMembers - this.teamStats.presentToday - this.teamStats.onLeave
    );
  }

  get totalPending(): number {
    return this.pendingApprovals.leaves + this.pendingApprovals.claims + this.pendingApprovals.wfh;
  }

  get claimsTotal(): number {
    return this.claimsPendingApproval.reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  get currentWeek(): WeekData {
    return this.weekTab() === 'this' ? this.weekAhead.thisWeek : this.weekAhead.nextWeek;
  }

  /** Count of team members not yet clocked in, surfaced in the roster. */
  get absentNames(): string {
    const absent = this.teamRoster.filter(m => m.status === 'Absent');
    if (absent.length === 0) return 'Everyone accounted for';
    const names = absent.slice(0, 2).map(m => m.name.split(/\s+/)[0]);
    const extra = absent.length - names.length;
    return names.join(', ') + (extra > 0 ? ` +${extra} more` : '');
  }

  // ─── Roster presentation ────────────────────────────────────
  rosterDotClass(status: string): string {
    switch (status) {
      case 'Present': return 'bg-emerald-500';
      case 'WFH': return 'bg-blue-500';
      case 'Leave': return 'bg-amber-500';
      default: return 'bg-slate-300 dark:bg-slate-600';
    }
  }

  rosterMeta(member: ManagerDashboardData['teamRoster'][number]): string {
    if (member.status === 'Present') return member.late ? `${member.clockIn} · Late` : (member.clockIn || 'In');
    if (member.status === 'WFH') return member.clockIn ? `${member.clockIn} · WFH` : 'WFH';
    if (member.status === 'Leave') return 'On leave';
    return 'Not in yet';
  }

  // ─── Actions ────────────────────────────────────────────────
  approveLeave(leave: { public_id: string }): void {
    this.router.navigate(['/leave'], { queryParams: { action: 'approve', id: leave.public_id } });
  }

  rejectLeave(leave: { public_id: string }): void {
    this.router.navigate(['/leave'], { queryParams: { action: 'reject', id: leave.public_id } });
  }

  approveClaim(claim: { public_id: string }): void {
    this.router.navigate(['/claims'], { queryParams: { action: 'approve', id: claim.public_id } });
  }

  rejectClaim(claim: { public_id: string }): void {
    this.router.navigate(['/claims'], { queryParams: { action: 'reject', id: claim.public_id } });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // ─── Avatar helpers ─────────────────────────────────────────
  private readonly avatarGradients = [
    'from-indigo-400 to-indigo-600',
    'from-rose-400 to-rose-600',
    'from-emerald-400 to-emerald-600',
    'from-amber-400 to-amber-600',
    'from-violet-400 to-violet-600',
    'from-sky-400 to-sky-600'
  ];

  getAvatarGradient(idx: number): string {
    return this.avatarGradients[idx % this.avatarGradients.length];
  }

  getInitials(name: string): string {
    if (!name) return '—';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] || '');
    return (first + second).toUpperCase();
  }
}
