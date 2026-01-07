import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { FileList } from '@/shared/components/file-list/file-list';
import { Leave, LeaveStatus } from '../../models/leave.model';
import { LeaveService } from '../../services/leave.service';
import type { ZardIcon } from '@/shared/components/icon/icons';

@Component({
  selector: 'app-leave-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardCardComponent,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardIconComponent,
    FileList
  ],
  templateUrl: './leave-details-component.html',
  styleUrl: './leave-details-component.css',
})
export class LeaveDetailsComponent implements OnInit {
  leave = signal<Leave | null>(null);

  LeaveStatus = LeaveStatus;

  // Signals for state management
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private leaveService: LeaveService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadLeaveDetails(+id);
    }
  }

  loadLeaveDetails(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.leaveService.getLeaveById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.leave.set(response.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load leave details');
        this.loading.set(false);
        console.error('Error loading leave:', err);
      }
    });
  }

  getStatusBadgeType(status: LeaveStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case LeaveStatus.APPROVED:
        return 'default';
      case LeaveStatus.PENDING:
        return 'outline';
      case LeaveStatus.REJECTED:
        return 'destructive';
      case LeaveStatus.CANCELLED:
        return 'secondary';
      default:
        return 'default';
    }
  }

  getStatusIcon(status: LeaveStatus): ZardIcon {
    switch (status) {
      case LeaveStatus.APPROVED:
        return 'circle-check';
      case LeaveStatus.PENDING:
        return 'clock';
      case LeaveStatus.REJECTED:
        return 'circle-x';
      case LeaveStatus.CANCELLED:
        return 'ban';
      default:
        return 'circle';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/leave']);
  }

  getInitials(name?: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
