import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../services/attendance.service';
import { Attendance, AttendanceQueryParams } from '../../models/attendance.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardMenuImports
  ],
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.css'
})
export class AttendanceListComponent implements OnInit {
  attendances = signal<Attendance[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalRecords = signal(0);
  limit = 10;

  // Filters
  selectedType = signal<'Office' | 'WFH' | ''>('');
  selectedDate = signal<string>('');
  showLateOnly = signal(false);
  showEarlyLeaveOnly = signal(false);
  employeeIdFilter = signal<number | null>(null);

  // Expose Math to template
  Math = Math;

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit(): void {
    this.loadAttendances();
  }

  loadAttendances(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: AttendanceQueryParams = {
      page: this.currentPage(),
      limit: this.limit
    };

    // Add filters if set
    if (this.selectedType()) {
      params.type = this.selectedType() as 'Office' | 'WFH';
    }

    if (this.showLateOnly()) {
      params.is_late = true;
    }

    if (this.showEarlyLeaveOnly()) {
      params.is_early_leave = true;
    }

    if (this.employeeIdFilter()) {
      params.employee_id = this.employeeIdFilter()!;
    }

    this.attendanceService.getAllAttendance(params).subscribe({
      next: (response: any) => {
        console.log('Attendance API Response:', response);

        // Handle different response structures
        let data: any[] = [];

        if (response && response.success) {
          // console.log('Full response object:', response);
          // console.log('response.data type:', typeof response.data);
          // console.log('response.data value:', response.data);

          // Check if data is an array
          if (Array.isArray(response.data)) {
            data = response.data;
            // console.log('Data is array with length:', data.length);
            // console.log('Data items:', data);
          } else if (response.data && typeof response.data === 'object') {
            // Maybe data is nested inside response.data
            console.warn('response.data is an object, checking for nested array...');

            // Check for response.data.attendance (the actual structure from backend)
            if (response.data.attendance && Array.isArray(response.data.attendance)) {
              console.log('Found nested array in response.data.attendance');
              data = response.data.attendance;
            }
            // Check if there's a data property inside response.data
            else if (response.data.data && Array.isArray(response.data.data)) {
              console.log('Found nested array in response.data.data');
              data = response.data.data;
            } else {
              console.warn('response.data is not an array and has no nested array:', response.data);
            }
          } else {
            console.warn('response.data is not an array:', response.data);
          }

          // Client-side date filtering if selectedDate is set
          if (this.selectedDate() && data.length > 0) {
            const filterDate = new Date(this.selectedDate()).toDateString();
            console.log('Applying date filter:', filterDate);
            data = data.filter(att => {
              const attDate = new Date(att.clock_in_time).toDateString();
              return attDate === filterDate;
            });
            console.log('Data after date filter:', data.length, 'items');
          }

          console.log('Setting attendances signal with', data.length, 'items');
          this.attendances.set(data);
          console.log('Attendances signal value:', this.attendances());

          // Safely access pagination properties
          // Check both response.pagination and response.data.pagination
          const paginationObj = response.pagination || response.data?.pagination;

          if (paginationObj) {
            this.totalPages.set(paginationObj.totalPages || 1);
            this.totalRecords.set(paginationObj.total || data.length);
            this.currentPage.set(paginationObj.page || 1);
          } else {
            // If no pagination object, set defaults
            this.totalPages.set(1);
            this.totalRecords.set(data.length);
            this.currentPage.set(1);
          }
        } else {
          console.warn('API response success is false or response is invalid');
          this.attendances.set([]);
          this.totalPages.set(1);
          this.totalRecords.set(0);
          this.currentPage.set(1);
        }

        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading attendances:', err);
        this.error.set(err.error?.message || err.message || 'Failed to load attendance records');
        this.attendances.set([]);
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadAttendances();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadAttendances();
    }
  }

  clearFilters(): void {
    this.selectedType.set('');
    this.selectedDate.set('');
    this.showLateOnly.set(false);
    this.showEarlyLeaveOnly.set(false);
    this.employeeIdFilter.set(null);
    this.currentPage.set(1);
    this.loadAttendances();
  }

  getStatusBadgeClass(attendance: Attendance): string {
    if (attendance.is_late && attendance.is_early_leave) {
      return 'badge-danger';
    }
    if (attendance.is_late) {
      return 'badge-warning';
    }
    if (attendance.is_early_leave) {
      return 'badge-info';
    }
    return 'badge-success';
  }

  getStatusText(attendance: Attendance): string {
    if (attendance.is_late && attendance.is_early_leave) {
      return `Late (${attendance.late_minutes}m) & Early Leave (${attendance.early_leave_minutes}m)`;
    }
    if (attendance.is_late) {
      return `Late (${attendance.late_minutes} minutes)`;
    }
    if (attendance.is_early_leave) {
      return `Early Leave (${attendance.early_leave_minutes} minutes)`;
    }
    return 'On Time';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString: string | null | undefined): string {
    if (!dateString) return '--:--';

    const date = new Date(dateString);
    return date.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatHours(hours: number | null | undefined): string {
    if (hours === null || hours === undefined) return '--';

    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  getTypeBadgeClass(type: string): string {
    return type === 'Office' ? 'badge-primary' : 'badge-secondary';
  }

  deleteAttendance(id: number): void {
    if (!confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    this.attendanceService.deleteAttendance(id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Attendance record deleted successfully');
          this.loadAttendances();
        }
      },
      error: (err: any) => {
        alert(err.error?.message || 'Failed to delete attendance record');
        console.error('Error deleting attendance:', err);
      }
    });
  }

  getTodaysDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: number[] = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, -1);
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push(-1, total);
    } else if (total > 1) {
      rangeWithDots.push(total);
    }

    return rangeWithDots;
  }
}
