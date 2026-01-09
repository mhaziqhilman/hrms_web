import { Component, OnInit, signal, inject } from '@angular/core';
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
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

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
    ZardDatePickerComponent,
    ZardTableImports,
    ZardTooltipModule
  ],
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.css'
})
export class AttendanceListComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private alertDialogService = inject(ZardAlertDialogService);

  attendances = signal<Attendance[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalRecords = signal(0);
  limit = signal(5);

  // Filters
  selectedType = signal<'Office' | 'WFH' | ''>('');
  selectedDate = signal<string>('');
  showLateOnly = signal(false);
  showEarlyLeaveOnly = signal(false);
  employeeIdFilter = signal<number | null>(null);

  // Date picker values
  dateValue: Date | null = null;

  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Selection
  selectedAttendances = signal<Set<number>>(new Set());
  selectAll = signal<boolean>(false);

  // Column visibility
  visibleColumns = signal<{[key: string]: boolean}>({
    employee: true,
    date: true,
    type: true,
    clockIn: true,
    clockOut: true,
    totalHours: false,
    status: true
  });

  // Column list for toggle menu
  columnList = [
    { key: 'employee', label: 'Employee' },
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'clockIn', label: 'Clock In' },
    { key: 'clockOut', label: 'Clock Out' },
    { key: 'totalHours', label: 'Total Hours' },
    { key: 'status', label: 'Status' }
  ];

  // Expose Math to template
  Math = Math;

  ngOnInit(): void {
    this.loadAttendances();
  }

  // Get selected count for bulk actions
  getSelectedCount(): number {
    return this.selectedAttendances().size;
  }

  // Clear selection
  clearSelection(): void {
    this.selectedAttendances.set(new Set());
    this.selectAll.set(false);
  }

  // Toggle column visibility
  toggleColumn(column: string): void {
    const current = this.visibleColumns();
    this.visibleColumns.set({
      ...current,
      [column]: !current[column]
    });
  }

  // Date change handler
  onDateChange(date: Date | null): void {
    if (date) {
      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      this.selectedDate.set(`${year}-${month}-${day}`);
    } else {
      this.selectedDate.set('');
    }
    this.dateValue = date;
    this.onFilterChange();
  }

  loadAttendances(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: AttendanceQueryParams = {
      page: this.currentPage(),
      limit: this.limit()
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

    if (this.selectedDate()) {
      params.start_date = this.selectedDate();
      console.log(params.start_date);
      
      params.end_date = this.selectedDate();
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
            // Use currentPage or page property
            this.currentPage.set(paginationObj.currentPage || paginationObj.page || 1);
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
    this.dateValue = null;
    this.showLateOnly.set(false);
    this.showEarlyLeaveOnly.set(false);
    this.employeeIdFilter.set(null);
    this.currentPage.set(1);
    this.loadAttendances();
  }

  getStatusDisplayName(): string {
    if (this.showLateOnly()) return 'Late Only';
    if (this.showEarlyLeaveOnly()) return 'Early Leave Only';
    return 'Status';
  }

  getTypeDisplayName(): string {
    const type = this.selectedType();
    if (!type) return 'Type';
    return type === 'WFH' ? 'Work From Home' : type;
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
          error: (err: any) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to delete attendance record',
              zOkText: 'OK'
            });
            console.error('Error deleting attendance:', err);
          }
        });
      }
    });
  }

  bulkDelete(): void {
    const selected = Array.from(this.selectedAttendances());
    if (selected.length === 0) {
      this.alertDialogService.warning({
        zTitle: 'No Selection',
        zDescription: 'Please select attendance records to delete',
        zOkText: 'OK'
      });
      return;
    }

    this.alertDialogService.confirm({
      zTitle: 'Delete Selected Records',
      zDescription: `Are you sure you want to delete ${selected.length} attendance record(s)?`,
      zOkText: 'Delete All',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.alertDialogService.info({
          zTitle: 'Success',
          zDescription: `${selected.length} attendance record(s) deleted successfully`,
          zOkText: 'OK'
        });
        this.selectedAttendances.set(new Set());
        this.selectAll.set(false);
        this.loadAttendances();
      }
    });
  }

  getTodaysDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Sorting methods
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
        case 'date':
          aValue = a.clock_in_time || '';
          bValue = b.clock_in_time || '';
          break;
        case 'type':
          aValue = a.type?.toLowerCase() || '';
          bValue = b.type?.toLowerCase() || '';
          break;
        case 'clockIn':
          aValue = a.clock_in_time || '';
          bValue = b.clock_in_time || '';
          break;
        case 'clockOut':
          aValue = a.clock_out_time || '';
          bValue = b.clock_out_time || '';
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

  // Selection methods
  toggleSelectAll(): void {
    const newSelectAll = !this.selectAll();
    this.selectAll.set(newSelectAll);

    if (newSelectAll) {
      const allIds = new Set(this.attendances().map(a => a.id));
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
    this.selectAll.set(selected.size === this.attendances().length && this.attendances().length > 0);
  }

  isAttendanceSelected(id: number): boolean {
    return this.selectedAttendances().has(id);
  }
}
