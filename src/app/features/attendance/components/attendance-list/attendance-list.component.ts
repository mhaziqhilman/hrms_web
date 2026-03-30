import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '@/core/services/auth.service';
import { Attendance, AttendanceQueryParams, WFHApplication } from '../../models/attendance.model';
import { DisplayService } from '@/core/services/display.service';

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
import { ZardSheetImports } from '@/shared/components/sheet/sheet.component';
import { ZardSegmentedComponent, type SegmentedOption } from '@/shared/components/segmented/segmented.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { AttendanceDialogComponent } from '../attendance-dialog/attendance-dialog.component';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardMenuImports,
    ZardTableImports,
    ZardTooltipModule,
    ZardCardComponent,
    ZardEmptyComponent,
    ZardDividerComponent,
    ZardSheetImports,
    ZardSegmentedComponent,
    ZardDatePickerComponent
  ],
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.css'
})
export class AttendanceListComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private alertDialogService = inject(ZardAlertDialogService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private displayService = inject(DisplayService);
  private fb = inject(FormBuilder);
  private dialogService = inject(ZardDialogService);

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

  // ===== WFH Sheet State =====
  wfhSheetOpen = signal(false);
  wfhActiveTab = signal<string>('personal');
  showWfhDialog = signal(false);

  // WFH Form
  wfhForm!: FormGroup;
  wfhSubmitting = signal(false);
  wfhSuccess = signal<string | null>(null);
  wfhError = signal<string | null>(null);

  // WFH Personal Applications
  wfhApplications = signal<WFHApplication[]>([]);
  wfhLoading = signal(false);
  wfhPage = signal(1);
  wfhTotalPages = signal(1);
  wfhStatusFilter = signal<'Pending' | 'Approved' | 'Rejected' | ''>('');

  // WFH Approval List (admin/manager)
  wfhApprovals = signal<WFHApplication[]>([]);
  wfhApprovalsLoading = signal(false);
  wfhApprovalsPage = signal(1);
  wfhApprovalsTotalPages = signal(1);
  wfhApprovalsStatusFilter = signal<'Pending' | 'Approved' | 'Rejected' | ''>('Pending');

  // Rejection modal
  showRejectionModal = signal(false);
  selectedApplicationId = signal<number | null>(null);
  rejectionReason = signal('');

  // Employee ID for personal WFH
  wfhEmployeeId = signal<string | null>(null);

  // Segmented options for admin
  wfhSegmentedOptions: SegmentedOption[] = [
    { value: 'personal', label: 'My Applications' },
    { value: 'approvals', label: 'Approvals' }
  ];

  isAdmin(): boolean {
    return this.authService.hasAnyRole(['admin', 'super_admin', 'manager']);
  }

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

  navigateToDetail(id: number | string | undefined): void {
    if (id) this.router.navigate(['/attendance', id]);
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
    return this.displayService.formatDate(dateString);
  }

  formatTime(dateString: string | null | undefined): string {
    return this.displayService.formatTime(dateString);
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
        this.attendanceService.deleteAttendance(attendance.public_id!).subscribe({
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

  // ===== Attendance Dialog =====

  openAttendanceDialog(): void {
    this.dialogService.create({
      zContent: AttendanceDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zWidth: '800px',
      zCustomClasses: 'p-0 gap-0 overflow-hidden',
      zData: {
        onSuccess: () => this.loadAttendances()
      }
    });
  }

  // ===== WFH Sheet Methods =====

  openWfhSheet(): void {
    const user = this.authService.getCurrentUserValue();
    this.wfhEmployeeId.set(user?.employee?.public_id ?? null);
    this.initWfhForm();
    this.wfhSheetOpen.set(true);
    this.wfhActiveTab.set('personal');
    this.loadWfhApplications();
    if (this.isAdmin()) {
      this.loadWfhApprovals();
    }
  }

  closeWfhSheet(): void {
    this.wfhSheetOpen.set(false);
    this.showWfhDialog.set(false);
    this.showRejectionModal.set(false);
  }

  onWfhTabChange(value: string): void {
    this.wfhActiveTab.set(value);
  }

  // --- WFH Form ---

  private initWfhForm(): void {
    this.wfhForm = this.fb.group({
      date: [null, [Validators.required]],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
    this.wfhSuccess.set(null);
    this.wfhError.set(null);
  }

  openWfhApplyDialog(): void {
    this.initWfhForm();
    this.showWfhDialog.set(true);
  }

  closeWfhApplyDialog(): void {
    this.showWfhDialog.set(false);
  }

  onWfhSubmit(): void {
    if (this.wfhForm.invalid) {
      Object.keys(this.wfhForm.controls).forEach(key => this.wfhForm.get(key)?.markAsTouched());
      return;
    }

    if (!this.wfhEmployeeId()) {
      this.wfhError.set('Employee ID not found. Please log in again.');
      return;
    }

    this.wfhSubmitting.set(true);
    this.wfhError.set(null);

    const formData = this.wfhForm.value;
    const dateVal: Date = formData.date;
    const dateStr = `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}-${String(dateVal.getDate()).padStart(2, '0')}`;

    this.attendanceService.submitWFHApplication({
      employee_id: this.wfhEmployeeId()!,
      date: dateStr,
      reason: formData.reason
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.wfhSuccess.set('WFH application submitted successfully!');
          this.showWfhDialog.set(false);
          this.wfhForm.reset();
          this.loadWfhApplications();
          if (this.isAdmin()) this.loadWfhApprovals();
          setTimeout(() => this.wfhSuccess.set(null), 3000);
        }
        this.wfhSubmitting.set(false);
      },
      error: (err) => {
        this.wfhError.set(err.error?.message || err.message || 'Failed to submit WFH application');
        this.wfhSubmitting.set(false);
      }
    });
  }

  isWfhFieldInvalid(fieldName: string): boolean {
    const field = this.wfhForm?.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getWfhFieldError(fieldName: string): string {
    const field = this.wfhForm?.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName === 'date' ? 'Date' : 'Reason'} is required`;
      if (field.errors['minlength']) return `Reason must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  getWfhMinDate(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  getWfhMaxDate(): Date {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    maxDate.setHours(0, 0, 0, 0);
    return maxDate;
  }

  // --- WFH Personal Applications ---

  loadWfhApplications(): void {
    if (!this.wfhEmployeeId()) return;

    this.wfhLoading.set(true);
    const params: any = {
      employee_id: this.wfhEmployeeId(),
      page: this.wfhPage(),
      limit: 10
    };
    if (this.wfhStatusFilter()) {
      params.status = this.wfhStatusFilter();
    }

    this.attendanceService.getWFHApplications(params).subscribe({
      next: (response: any) => {
        if (response?.success) {
          let data: any[] = [];
          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data && typeof response.data === 'object') {
            if (response.data.wfh_applications) data = response.data.wfh_applications;
            else if (response.data.wfhApplications) data = response.data.wfhApplications;
            else if (response.data.data) data = response.data.data;
          }
          this.wfhApplications.set(data);
          const pag = response.pagination || response.data?.pagination;
          this.wfhTotalPages.set(pag?.totalPages || 1);
        } else {
          this.wfhApplications.set([]);
        }
        this.wfhLoading.set(false);
      },
      error: () => {
        this.wfhApplications.set([]);
        this.wfhLoading.set(false);
      }
    });
  }

  onWfhStatusFilterChange(): void {
    this.wfhPage.set(1);
    this.loadWfhApplications();
  }

  onWfhPageChange(page: number): void {
    if (page >= 1 && page <= this.wfhTotalPages()) {
      this.wfhPage.set(page);
      this.loadWfhApplications();
    }
  }

  cancelWfhApplication(id: number): void {
    this.alertDialogService.confirm({
      zTitle: 'Cancel WFH Application',
      zDescription: 'Are you sure you want to cancel this WFH application?',
      zOkText: 'Cancel Application',
      zCancelText: 'Keep',
      zOkDestructive: true,
      zOnOk: () => {
        this.attendanceService.cancelWFHApplication(id).subscribe({
          next: (response) => {
            if (response.success) {
              this.wfhSuccess.set('WFH application cancelled');
              this.loadWfhApplications();
              setTimeout(() => this.wfhSuccess.set(null), 3000);
            }
          },
          error: (err) => {
            this.wfhError.set(err.error?.message || 'Failed to cancel WFH application');
          }
        });
      }
    });
  }

  canCancelWfh(app: WFHApplication): boolean {
    if (app.status !== 'Pending') return false;
    const date = new Date(app.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }

  // --- WFH Approvals (admin/manager) ---

  loadWfhApprovals(): void {
    this.wfhApprovalsLoading.set(true);
    const params: any = {
      page: this.wfhApprovalsPage(),
      limit: 10,
      manager_view: true
    };
    if (this.wfhApprovalsStatusFilter()) {
      params.status = this.wfhApprovalsStatusFilter();
    }

    this.attendanceService.getWFHApplications(params).subscribe({
      next: (response: any) => {
        if (response?.success) {
          let data: any[] = [];
          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data && typeof response.data === 'object') {
            if (response.data.wfh_applications) data = response.data.wfh_applications;
            else if (response.data.wfhApplications) data = response.data.wfhApplications;
            else if (response.data.data) data = response.data.data;
          }
          this.wfhApprovals.set(data);
          const pag = response.pagination || response.data?.pagination;
          this.wfhApprovalsTotalPages.set(pag?.totalPages || 1);
        } else {
          this.wfhApprovals.set([]);
        }
        this.wfhApprovalsLoading.set(false);
      },
      error: () => {
        this.wfhApprovals.set([]);
        this.wfhApprovalsLoading.set(false);
      }
    });
  }

  onWfhApprovalsStatusChange(): void {
    this.wfhApprovalsPage.set(1);
    this.loadWfhApprovals();
  }

  onWfhApprovalsPageChange(page: number): void {
    if (page >= 1 && page <= this.wfhApprovalsTotalPages()) {
      this.wfhApprovalsPage.set(page);
      this.loadWfhApprovals();
    }
  }

  approveWfh(id: number): void {
    this.alertDialogService.confirm({
      zTitle: 'Approve WFH Application',
      zDescription: 'Are you sure you want to approve this WFH application?',
      zOkText: 'Approve',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.attendanceService.approveRejectWFH(id, 'approve').subscribe({
          next: (response) => {
            if (response.success) {
              this.wfhSuccess.set('WFH application approved');
              this.loadWfhApprovals();
              this.loadWfhApplications();
              setTimeout(() => this.wfhSuccess.set(null), 3000);
            }
          },
          error: (err) => {
            this.wfhError.set(err.error?.message || 'Failed to approve');
            setTimeout(() => this.wfhError.set(null), 5000);
          }
        });
      }
    });
  }

  openRejectModal(id: number): void {
    this.selectedApplicationId.set(id);
    this.rejectionReason.set('');
    this.showRejectionModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectionModal.set(false);
    this.selectedApplicationId.set(null);
    this.rejectionReason.set('');
  }

  submitRejection(): void {
    const id = this.selectedApplicationId();
    const reason = this.rejectionReason().trim();
    if (!id || !reason) return;

    this.attendanceService.approveRejectWFH(id, 'reject', reason).subscribe({
      next: (response) => {
        if (response.success) {
          this.wfhSuccess.set('WFH application rejected');
          this.loadWfhApprovals();
          this.loadWfhApplications();
          this.closeRejectModal();
          setTimeout(() => this.wfhSuccess.set(null), 3000);
        }
      },
      error: (err) => {
        this.wfhError.set(err.error?.message || 'Failed to reject');
        setTimeout(() => this.wfhError.set(null), 5000);
      }
    });
  }

  canApproveReject(app: WFHApplication): boolean {
    if (app.status !== 'Pending') return false;
    const date = new Date(app.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }

  getEmployeeInitial(app: WFHApplication): string {
    return (app.employee?.full_name || 'U').charAt(0).toUpperCase();
  }

  formatWfhDate(dateString: string): string {
    return this.displayService.formatDate(dateString);
  }

  formatWfhDateTime(dateString: string | null | undefined): string {
    return this.displayService.formatDateTime(dateString);
  }
}
