import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '@/core/services/auth.service';
import { Attendance, AttendanceQueryParams } from '../../models/attendance.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';

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
    ZardMenuImports,
    ZardTableImports,
    ZardTooltipModule,
    ZardCardComponent,
    ZardEmptyComponent,
    ZardDividerComponent
  ],
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.css'
})
export class AttendanceListComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private alertDialogService = inject(ZardAlertDialogService);
  private authService = inject(AuthService);
  private router = inject(Router);

  attendances = signal<Attendance[]>([]);
  loading = signal(false);
  hasProfile = signal(true);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalRecords = signal(0);
  limit = signal(50);

  // Date navigation
  currentViewDate = signal<Date>(new Date());

  // Search
  searchQuery = signal('');

  // Filters
  selectedType = signal<'Office' | 'WFH' | ''>('');
  selectedDate = signal<string>('');
  showLateOnly = signal(false);
  showEarlyLeaveOnly = signal(false);
  employeeIdFilter = signal<number | null>(null);

  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Selection
  selectedAttendances = signal<Set<number>>(new Set());
  selectAll = signal<boolean>(false);

  // Column visibility
  visibleColumns = signal<{[key: string]: boolean}>({
    employee: true,
    clockInOut: true,
    overtime: true,
    location: true,
    note: true
  });

  columnList = [
    { key: 'employee', label: 'Employee Name' },
    { key: 'clockInOut', label: 'Clock-in & Out' },
    { key: 'overtime', label: 'Overtime' },
    { key: 'location', label: 'Location' },
    { key: 'note', label: 'Note' }
  ];

  Math = Math;

  // Computed: filtered attendances based on search query
  filteredAttendances = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const records = this.attendances();
    if (!query) return records;
    return records.filter(a =>
      a.employee?.full_name?.toLowerCase().includes(query) ||
      a.employee?.employee_code?.toLowerCase().includes(query)
    );
  });

  // Computed: summary statistics from loaded data
  summaryStats = computed(() => {
    const records = this.attendances();
    const withHours = records.filter(a => a.total_hours != null && a.total_hours > 0);
    return {
      total: records.length,
      onTime: records.filter(a => a.clock_in_time && !a.is_late).length,
      late: records.filter(a => a.is_late).length,
      earlyLeave: records.filter(a => a.is_early_leave).length,
      noClockOut: records.filter(a => a.clock_in_time && !a.clock_out_time).length,
      office: records.filter(a => a.type === 'Office').length,
      wfh: records.filter(a => a.type === 'WFH').length,
      avgHours: withHours.length > 0
        ? withHours.reduce((sum, a) => sum + (a.total_hours || 0), 0) / withHours.length
        : 0,
      overtime: records.filter(a => (a.total_hours || 0) > 9).length
    };
  });

  ngOnInit(): void {
    this.setDateFilter(new Date());

    const user = this.authService.getCurrentUserValue();
    if (user?.employee) {
      this.hasProfile.set(true);
      this.loadAttendances();
    } else {
      this.loading.set(true);
      this.authService.getCurrentUser().subscribe({
        next: (res) => {
          if (res.success && res.data?.employee) {
            this.hasProfile.set(true);
            this.loadAttendances();
          } else {
            this.hasProfile.set(false);
            this.loading.set(false);
          }
        },
        error: () => {
          this.hasProfile.set(false);
          this.loading.set(false);
        }
      });
    }
  }

  // Date navigation
  navigateDate(direction: -1 | 1): void {
    const current = new Date(this.currentViewDate());
    current.setDate(current.getDate() + direction);
    this.currentViewDate.set(current);
    this.setDateFilter(current);
    this.currentPage.set(1);
    this.loadAttendances();
  }

  goToToday(): void {
    const today = new Date();
    this.currentViewDate.set(today);
    this.setDateFilter(today);
    this.currentPage.set(1);
    this.loadAttendances();
  }

  formatViewDate(): string {
    return this.currentViewDate().toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  private setDateFilter(date: Date): void {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    this.selectedDate.set(`${year}-${month}-${day}`);
  }

  // Overtime & duration calculations
  calculateOvertime(attendance: Attendance): string {
    if (!attendance.total_hours || attendance.total_hours <= 9) return '-';
    const overtime = attendance.total_hours - 9;
    const h = Math.floor(overtime);
    const m = Math.round((overtime - h) * 60);
    return `${h}h ${m}m`;
  }

  calculateDuration(attendance: Attendance): string {
    if (!attendance.clock_in_time || !attendance.clock_out_time) return '--';
    const diff = new Date(attendance.clock_out_time).getTime() - new Date(attendance.clock_in_time).getTime();
    if (diff <= 0) return '--';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  isOvertime(attendance: Attendance): boolean {
    return (attendance.total_hours || 0) > 9;
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/attendance', id]);
  }

  // Toggle column visibility
  toggleColumn(column: string): void {
    const current = this.visibleColumns();
    this.visibleColumns.set({
      ...current,
      [column]: !current[column]
    });
  }

  loadAttendances(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: AttendanceQueryParams = {
      page: this.currentPage(),
      limit: this.limit()
    };

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

    if (this.selectedDate()) {
      params.start_date = this.selectedDate();
      params.end_date = this.selectedDate();
    }

    this.attendanceService.getAllAttendance(params).subscribe({
      next: (response: any) => {
        let data: any[] = [];

        if (response && response.success) {
          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data && typeof response.data === 'object') {
            if (response.data.attendance && Array.isArray(response.data.attendance)) {
              data = response.data.attendance;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              data = response.data.data;
            }
          }

          // Client-side date filtering
          if (this.selectedDate() && data.length > 0) {
            const filterDate = new Date(this.selectedDate()).toDateString();
            data = data.filter(att => {
              const attDate = new Date(att.clock_in_time).toDateString();
              return attDate === filterDate;
            });
          }

          this.attendances.set(data);

          const paginationObj = response.pagination || response.data?.pagination;
          if (paginationObj) {
            this.totalPages.set(paginationObj.totalPages || 1);
            this.totalRecords.set(paginationObj.total || data.length);
            this.currentPage.set(paginationObj.currentPage || paginationObj.page || 1);
          } else {
            this.totalPages.set(1);
            this.totalRecords.set(data.length);
            this.currentPage.set(1);
          }
        } else {
          this.attendances.set([]);
          this.totalPages.set(1);
          this.totalRecords.set(0);
          this.currentPage.set(1);
        }

        this.loading.set(false);
      },
      error: (err: any) => {
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
    this.showLateOnly.set(false);
    this.showEarlyLeaveOnly.set(false);
    this.employeeIdFilter.set(null);
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadAttendances();
  }

  getStatusDisplayName(): string {
    if (this.showLateOnly()) return 'Late Only';
    if (this.showEarlyLeaveOnly()) return 'Early Leave';
    return 'Status';
  }

  getTypeDisplayName(): string {
    const type = this.selectedType();
    if (!type) return 'Type';
    return type === 'WFH' ? 'Work From Home' : type;
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
    if (hours === null || hours === undefined || isNaN(hours)) return '--';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  deleteAttendance(attendance: Attendance): void {
    this.alertDialogService.confirm({
      zTitle: 'Delete Attendance Record',
      zDescription: `Are you sure you want to delete the attendance record for ${attendance.employee?.full_name || 'this employee'}?`,
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.attendanceService.deleteAttendance(attendance.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Attendance record deleted successfully',
                zOkText: 'OK'
              });
              this.loadAttendances();
            }
          },
          error: () => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to delete attendance record',
              zOkText: 'OK'
            });
          }
        });
      }
    });
  }

  // Sorting
  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.sortAttendances();
  }

  sortAttendances(): void {
    const column = this.sortColumn();
    const direction = this.sortDirection();
    if (!column) return;

    const sorted = [...this.attendances()].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (column) {
        case 'employee':
          aValue = a.employee?.full_name?.toLowerCase() || '';
          bValue = b.employee?.full_name?.toLowerCase() || '';
          break;
        case 'clockIn':
          aValue = a.clock_in_time || '';
          bValue = b.clock_in_time || '';
          break;
        case 'totalHours':
          aValue = a.total_hours || 0;
          bValue = b.total_hours || 0;
          break;
        case 'status':
          aValue = this.getStatusText(a).toLowerCase();
          bValue = this.getStatusText(b).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    this.attendances.set(sorted);
  }

  getSortIcon(column: string): 'chevrons-up-down' | 'chevron-up' | 'chevron-down' {
    if (this.sortColumn() !== column) return 'chevrons-up-down';
    return this.sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  isSortActive(column: string): boolean {
    return this.sortColumn() === column;
  }

  // Selection (kept for potential future use)
  toggleSelectAll(): void {
    const newSelectAll = !this.selectAll();
    this.selectAll.set(newSelectAll);
    if (newSelectAll) {
      const allIds = new Set(this.filteredAttendances().map(a => a.id));
      this.selectedAttendances.set(allIds);
    } else {
      this.selectedAttendances.set(new Set());
    }
  }

  toggleAttendanceSelection(id: number): void {
    const selected = new Set(this.selectedAttendances());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedAttendances.set(selected);
    this.selectAll.set(selected.size === this.filteredAttendances().length && this.filteredAttendances().length > 0);
  }

  isAttendanceSelected(id: number): boolean {
    return this.selectedAttendances().has(id);
  }

  getSelectedCount(): number {
    return this.selectedAttendances().size;
  }

  clearSelection(): void {
    this.selectedAttendances.set(new Set());
    this.selectAll.set(false);
  }
}
