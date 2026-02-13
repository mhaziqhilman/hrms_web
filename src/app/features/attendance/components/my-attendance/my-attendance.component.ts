import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '@/core/services/auth.service';
import { Attendance, WFHApplication } from '../../models/attendance.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-my-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardMenuImports,
    ZardDatePickerComponent
  ],
  templateUrl: './my-attendance.component.html'
})
export class MyAttendanceComponent implements OnInit, OnDestroy {
  // Clock
  currentTime = signal(new Date());
  private clockInterval?: any;

  // Tab state
  activeTab = signal<'history' | 'wfh'>('history');

  // Clock in/out state
  isClockedIn = signal(false);
  clockInTime = signal<string | null>(null);
  clockOutTime = signal<string | null>(null);
  totalHours = signal<number>(0);
  attendanceType = signal<'Office' | 'WFH'>('Office');
  todayAttendance = signal<Attendance | null>(null);
  locationPermission = signal<'granted' | 'denied' | 'prompt'>('prompt');
  loadingLocation = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Employee
  employeeId = signal<number | null>(null);

  // History state
  attendances = signal<Attendance[]>([]);
  loadingHistory = signal(false);
  historyPage = signal(1);
  historyTotalPages = signal(1);
  historyMonth = signal(new Date().getMonth());
  historyYear = signal(new Date().getFullYear());

  currentMonthLabel = computed(() => {
    const date = new Date(this.historyYear(), this.historyMonth(), 1);
    return date.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  });

  // WFH state
  wfhForm!: FormGroup;
  wfhApplications = signal<WFHApplication[]>([]);
  loadingWfh = signal(false);
  submittingWfh = signal(false);
  wfhPage = signal(1);
  wfhTotalPages = signal(1);
  wfhStatusFilter = signal<'' | 'Pending' | 'Approved' | 'Rejected'>('');
  wfhError = signal<string | null>(null);
  wfhSuccess = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();
    this.employeeId.set(user?.employee?.id ?? null);

    // Start real-time clock
    this.updateClock();
    this.clockInterval = setInterval(() => {
      this.updateClock();
      this.updateTotalHours();
    }, 1000);

    this.checkGeolocationPermission();
    this.loadTodayAttendance();
    this.loadHistory();

    // Init WFH form
    this.wfhForm = this.fb.group({
      date: [null, [Validators.required]],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  // ──────────────── Tab ────────────────

  switchTab(tab: 'history' | 'wfh'): void {
    this.activeTab.set(tab);
    if (tab === 'wfh' && this.wfhApplications().length === 0) {
      this.loadWfhApplications();
    }
  }

  // ──────────────── Clock ────────────────

  updateClock(): void {
    this.currentTime.set(new Date());
  }

  updateTotalHours(): void {
    if (this.isClockedIn() && this.clockInTime()) {
      const clockIn = new Date(this.clockInTime()!);
      const now = new Date();
      const hours = (now.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      this.totalHours.set(hours);
    }
  }

  formatCurrentTime(): string {
    return this.currentTime().toLocaleTimeString('en-MY', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  }

  formatCurrentDate(): string {
    return this.currentTime().toLocaleDateString('en-MY', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  formatTime(dateString: string | null): string {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-MY', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  // ──────────────── Geolocation ────────────────

  checkGeolocationPermission(): void {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        this.locationPermission.set(result.state as 'granted' | 'denied' | 'prompt');
      });
    }
  }

  async getCurrentLocation(): Promise<{ lat: number; long: number; address: string }> {
    this.loadingLocation.set(true);
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        this.loadingLocation.set(false);
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const long = position.coords.longitude;
          const address = `Lat: ${lat.toFixed(6)}, Long: ${long.toFixed(6)}`;
          this.loadingLocation.set(false);
          resolve({ lat, long, address });
        },
        (error) => {
          this.loadingLocation.set(false);
          let msg = 'Unable to retrieve location';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission denied. Please enable location access.';
            this.locationPermission.set('denied');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'Location information unavailable';
          } else if (error.code === error.TIMEOUT) {
            msg = 'Location request timed out';
          }
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  // ──────────────── Today's Attendance ────────────────

  loadTodayAttendance(): void {
    if (!this.employeeId()) return;

    this.attendanceService.getTodayAttendance(this.employeeId()!).subscribe({
      next: (response: any) => {
        if (response.success) {
          let arr: any[] = [];
          if (Array.isArray(response.data)) {
            arr = response.data;
          } else if (response.data && typeof response.data === 'object') {
            if (response.data.attendance && Array.isArray(response.data.attendance)) {
              arr = response.data.attendance;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              arr = response.data.data;
            }
          }
          if (arr.length > 0) {
            const a = arr[0];
            this.todayAttendance.set(a);
            this.isClockedIn.set(!a.clock_out_time);
            this.clockInTime.set(a.clock_in_time);
            this.clockOutTime.set(a.clock_out_time || null);
            this.attendanceType.set(a.type);
            if (a.clock_out_time) {
              this.totalHours.set(a.total_hours || 0);
            }
          } else {
            this.resetTodayState();
          }
        } else {
          this.resetTodayState();
        }
      },
      error: () => this.resetTodayState()
    });
  }

  private resetTodayState(): void {
    this.todayAttendance.set(null);
    this.isClockedIn.set(false);
    this.clockInTime.set(null);
    this.clockOutTime.set(null);
  }

  async clockIn(): Promise<void> {
    this.error.set(null);
    this.success.set(null);
    if (!this.employeeId()) {
      this.error.set('Employee ID not found. Please log in again.');
      return;
    }
    if (this.isClockedIn()) {
      this.error.set('You have already clocked in today');
      return;
    }
    this.loading.set(true);
    try {
      let location = null;
      if (this.attendanceType() === 'Office') {
        try {
          location = await this.getCurrentLocation();
        } catch (err: any) {
          this.error.set(err.message || 'Failed to get location');
          this.loading.set(false);
          return;
        }
      }
      const request: any = { employee_id: this.employeeId()!, type: this.attendanceType() };
      if (location) {
        request.location_lat = location.lat;
        request.location_long = location.long;
        request.location_address = location.address;
      }
      this.attendanceService.clockIn(request).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.todayAttendance.set(response.data);
            this.isClockedIn.set(true);
            this.clockInTime.set(response.data.clock_in_time);
            this.success.set('Clocked in successfully!');
            setTimeout(() => this.success.set(null), 3000);
            setTimeout(() => { this.loadTodayAttendance(); this.loadHistory(); }, 500);
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          this.error.set(err.error?.message || err.message || 'Failed to clock in');
          this.loading.set(false);
        }
      });
    } catch (err: any) {
      this.error.set(err.message || 'An unexpected error occurred');
      this.loading.set(false);
    }
  }

  async clockOut(): Promise<void> {
    this.error.set(null);
    this.success.set(null);
    if (!this.employeeId()) {
      this.error.set('Employee ID not found. Please log in again.');
      return;
    }
    if (!this.isClockedIn()) {
      this.error.set('You need to clock in first');
      return;
    }
    this.loading.set(true);
    try {
      let location = null;
      if (this.attendanceType() === 'Office') {
        try {
          location = await this.getCurrentLocation();
        } catch { /* continue without location */ }
      }
      const request: any = { employee_id: this.employeeId()! };
      if (location) {
        request.location_lat = location.lat;
        request.location_long = location.long;
        request.location_address = location.address;
      }
      this.attendanceService.clockOut(request).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.todayAttendance.set(response.data);
            this.isClockedIn.set(false);
            this.clockOutTime.set(response.data.clock_out_time || null);
            this.totalHours.set(response.data.total_hours || 0);
            this.success.set('Clocked out successfully!');
            setTimeout(() => this.success.set(null), 3000);
            setTimeout(() => { this.loadTodayAttendance(); this.loadHistory(); }, 500);
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          this.error.set(err.error?.message || err.message || 'Failed to clock out');
          this.loading.set(false);
        }
      });
    } catch (err: any) {
      this.error.set(err.message || 'An unexpected error occurred');
      this.loading.set(false);
    }
  }

  getStatusText(): string {
    const a = this.todayAttendance();
    if (!a) return 'Not Clocked In';
    if (!a.clock_out_time) return 'Working';
    if (a.is_late && a.is_early_leave) return `Late & Early Leave`;
    if (a.is_late) return `Late (${a.late_minutes || 0}m)`;
    if (a.is_early_leave) return `Early Leave (${a.early_leave_minutes || 0}m)`;
    return 'On Time';
  }

  getStatusBadgeType(): 'default' | 'secondary' | 'destructive' | 'outline' {
    const a = this.todayAttendance();
    if (!a) return 'secondary';
    if (!a.clock_out_time) return 'outline';
    if (a.is_late || a.is_early_leave) return 'destructive';
    return 'default';
  }

  // ──────────────── History ────────────────

  loadHistory(): void {
    if (!this.employeeId()) return;
    this.loadingHistory.set(true);

    const startDate = new Date(this.historyYear(), this.historyMonth(), 1);
    const endDate = new Date(this.historyYear(), this.historyMonth() + 1, 0);

    const params: any = {
      employee_id: this.employeeId(),
      page: this.historyPage(),
      limit: 10,
      start_date: this.toDateStr(startDate),
      end_date: this.toDateStr(endDate)
    };

    this.attendanceService.getAllAttendance(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          let arr: any[] = [];
          if (Array.isArray(response.data)) {
            arr = response.data;
          } else if (response.data && typeof response.data === 'object') {
            if (response.data.attendance && Array.isArray(response.data.attendance)) {
              arr = response.data.attendance;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              arr = response.data.data;
            }
          }
          this.attendances.set(arr);
          const pagination = response.pagination || response.data?.pagination;
          this.historyTotalPages.set(pagination?.totalPages || 1);
        } else {
          this.attendances.set([]);
        }
        this.loadingHistory.set(false);
      },
      error: () => {
        this.attendances.set([]);
        this.loadingHistory.set(false);
      }
    });
  }

  prevMonth(): void {
    let m = this.historyMonth() - 1;
    let y = this.historyYear();
    if (m < 0) { m = 11; y--; }
    this.historyMonth.set(m);
    this.historyYear.set(y);
    this.historyPage.set(1);
    this.loadHistory();
  }

  nextMonth(): void {
    const now = new Date();
    let m = this.historyMonth() + 1;
    let y = this.historyYear();
    if (m > 11) { m = 0; y++; }
    // Don't go beyond current month
    if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth())) return;
    this.historyMonth.set(m);
    this.historyYear.set(y);
    this.historyPage.set(1);
    this.loadHistory();
  }

  isCurrentMonth(): boolean {
    const now = new Date();
    return this.historyMonth() === now.getMonth() && this.historyYear() === now.getFullYear();
  }

  onHistoryPageChange(page: number): void {
    if (page >= 1 && page <= this.historyTotalPages()) {
      this.historyPage.set(page);
      this.loadHistory();
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  }

  getAttendanceStatusBadgeType(a: Attendance): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (!a.clock_out_time) return 'outline';
    if (a.is_late || a.is_early_leave) return 'destructive';
    return 'default';
  }

  getAttendanceStatusText(a: Attendance): string {
    if (!a.clock_out_time) return 'Working';
    if (a.is_late && a.is_early_leave) return 'Late & Early';
    if (a.is_late) return 'Late';
    if (a.is_early_leave) return 'Early Leave';
    return 'On Time';
  }

  // ──────────────── WFH ────────────────

  loadWfhApplications(): void {
    if (!this.employeeId()) return;
    this.loadingWfh.set(true);
    this.wfhError.set(null);

    const params: any = {
      employee_id: this.employeeId(),
      page: this.wfhPage(),
      limit: 10
    };
    if (this.wfhStatusFilter()) {
      params.status = this.wfhStatusFilter();
    }

    this.attendanceService.getWFHApplications(params).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          let data: any[] = [];
          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data && typeof response.data === 'object') {
            if (response.data.wfh_applications && Array.isArray(response.data.wfh_applications)) {
              data = response.data.wfh_applications;
            } else if (response.data.wfhApplications && Array.isArray(response.data.wfhApplications)) {
              data = response.data.wfhApplications;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              data = response.data.data;
            }
          }
          this.wfhApplications.set(data);
          const pagination = response.pagination || response.data?.pagination;
          this.wfhTotalPages.set(pagination?.totalPages || 1);
        } else {
          this.wfhApplications.set([]);
        }
        this.loadingWfh.set(false);
      },
      error: (err) => {
        this.wfhError.set(err.error?.message || 'Failed to load WFH applications');
        this.wfhApplications.set([]);
        this.loadingWfh.set(false);
      }
    });
  }

  onWfhSubmit(): void {
    if (this.wfhForm.invalid) {
      Object.keys(this.wfhForm.controls).forEach(key => this.wfhForm.get(key)?.markAsTouched());
      return;
    }
    if (!this.employeeId()) {
      this.wfhError.set('Employee ID not found. Please log in again.');
      return;
    }
    this.submittingWfh.set(true);
    this.wfhError.set(null);
    this.wfhSuccess.set(null);

    const formData = this.wfhForm.value;
    const dateVal: Date = formData.date;
    const dateStr = `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}-${String(dateVal.getDate()).padStart(2, '0')}`;

    this.attendanceService.submitWFHApplication({
      employee_id: this.employeeId()!,
      date: dateStr,
      reason: formData.reason
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.wfhSuccess.set('WFH application submitted successfully!');
          this.wfhForm.reset();
          this.loadWfhApplications();
          setTimeout(() => this.wfhSuccess.set(null), 3000);
        }
        this.submittingWfh.set(false);
      },
      error: (err) => {
        this.wfhError.set(err.error?.message || err.message || 'Failed to submit WFH application');
        this.submittingWfh.set(false);
      }
    });
  }

  onWfhFilterChange(): void {
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
    if (!confirm('Are you sure you want to cancel this WFH application?')) return;
    this.attendanceService.cancelWFHApplication(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.wfhSuccess.set('WFH application cancelled');
          this.loadWfhApplications();
          setTimeout(() => this.wfhSuccess.set(null), 3000);
        }
      },
      error: (err) => {
        this.wfhError.set(err.error?.message || 'Failed to cancel application');
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

  formatWfhDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.wfhForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.wfhForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `Must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  getMinDate(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  getMaxDate(): Date {
    const max = new Date();
    max.setDate(max.getDate() + 30);
    max.setHours(0, 0, 0, 0);
    return max;
  }

  // ──────────────── Helpers ────────────────

  private toDateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
