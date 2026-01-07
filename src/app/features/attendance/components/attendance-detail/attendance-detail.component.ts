import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { Attendance } from '../../models/attendance.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';

@Component({
  selector: 'app-attendance-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardDividerComponent
  ],
  templateUrl: './attendance-detail.component.html',
  styleUrl: './attendance-detail.component.css'
})
export class AttendanceDetailComponent implements OnInit {
  attendance = signal<Attendance | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  attendanceId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.attendanceId = +id;
        this.loadAttendanceDetail();
      } else {
        this.error.set('Invalid attendance ID');
      }
    });
  }

  loadAttendanceDetail(): void {
    if (!this.attendanceId) return;

    this.loading.set(true);
    this.error.set(null);

    this.attendanceService.getAttendanceById(this.attendanceId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.attendance.set(response.data);
        } else {
          this.error.set('Attendance record not found');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load attendance details');
        this.loading.set(false);
        console.error('Error loading attendance details:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/attendance']);
  }

  deleteAttendance(): void {
    if (!this.attendanceId) return;

    if (!confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    this.attendanceService.deleteAttendance(this.attendanceId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Attendance record deleted successfully');
          this.goBack();
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete attendance record');
        console.error('Error deleting attendance:', err);
      }
    });
  }

  getStatusBadgeClass(): string {
    const att = this.attendance();
    if (!att) return 'badge-secondary';

    if (att.is_late && att.is_early_leave) {
      return 'badge-danger';
    }
    if (att.is_late) {
      return 'badge-warning';
    }
    if (att.is_early_leave) {
      return 'badge-info';
    }
    return 'badge-success';
  }

  getStatusText(): string {
    const att = this.attendance();
    if (!att) return '';

    if (att.is_late && att.is_early_leave) {
      return `Late (${att.late_minutes}m) & Early Leave (${att.early_leave_minutes}m)`;
    }
    if (att.is_late) {
      return `Late (${att.late_minutes} minutes)`;
    }
    if (att.is_early_leave) {
      return `Early Leave (${att.early_leave_minutes} minutes)`;
    }
    return 'On Time';
  }

  getTypeBadgeClass(type: string): string {
    return type === 'Office' ? 'badge-primary' : 'badge-secondary';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(dateString: string | null | undefined): string {
    if (!dateString) return '--:--';

    const date = new Date(dateString);
    return date.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  formatHours(hours: number | null | undefined): string {
    if (hours === null || hours === undefined) return '--';

    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  }
}
