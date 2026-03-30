import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '@/core/services/auth.service';
import { DisplayService } from '@/core/services/display.service';
import { Attendance } from '../../models/attendance.model';
import { EmployeeService } from '@/features/employees/services/employee.service';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';
import { ZardSegmentedComponent, type SegmentedOption } from '@/shared/components/segmented/segmented.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';

@Component({
  selector: 'app-attendance-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardDividerComponent,
    ZardSegmentedComponent,
    ZardDatePickerComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardAvatarComponent
  ],
  templateUrl: './attendance-dialog.component.html',
  styles: [`
    :host { display: block; }
  `]
})
export class AttendanceDialogComponent implements OnInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);
  private displayService = inject(DisplayService);
  private employeeService = inject(EmployeeService);
  private dialogRef = inject(ZardDialogRef);
  private modalData = inject(Z_MODAL_DATA, { optional: true }) as { onSuccess?: () => void } | null;
  private fb = inject(FormBuilder);

  // Clock
  currentTime = signal(new Date());
  private clockInterval?: ReturnType<typeof setInterval>;

  // Today's attendance
  todayAttendance = signal<Attendance | null>(null);
  isClockedIn = signal(false);
  clockInTime = signal<string | null>(null);
  clockOutTime = signal<string | null>(null);
  totalHours = signal<number>(0);

  // UI State
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  activeMode = signal<string>('clock');

  // Employee
  employeeId = signal<string | null>(null);

  // Type toggle
  attendanceType = signal<'Office' | 'WFH'>('Office');
  typeOptions: SegmentedOption[] = [
    { value: 'Office', label: 'Office' },
    { value: 'WFH', label: 'WFH' }
  ];

  // Mode toggle
  modeOptions: SegmentedOption[] = [
    { value: 'clock', label: 'Clock In/Out' },
    { value: 'manual', label: 'Manual Entry' }
  ];

  // Manual form
  manualForm!: FormGroup;
  manualDate = signal<Date | null>(new Date());
  todoNotes = signal('');

  // Time picker signals
  timeInHour = signal(9);
  timeInMinute = signal(0);
  timeInPeriod = signal<'AM' | 'PM'>('AM');
  timeOutHour = signal(6);
  timeOutMinute = signal(0);
  timeOutPeriod = signal<'AM' | 'PM'>('PM');

  // Admin: employee selection
  isAdminUser = signal(false);
  employees = signal<any[]>([]);
  loadingEmployees = signal(false);
  selectedEmployeeName = signal<string | null>(null);

  // Location
  loadingLocation = signal(false);

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();
    this.employeeId.set(user?.employee?.public_id ?? null);
    this.selectedEmployeeName.set(user?.employee?.full_name ?? null);
    this.isAdminUser.set(this.authService.hasAnyRole(['admin', 'super_admin']));

    if (this.isAdminUser()) {
      this.loadEmployees();
    }

    this.initManualForm();
    this.startClock();
    this.loadTodayAttendance();
  }

  private loadEmployees(): void {
    this.loadingEmployees.set(true);
    this.employeeService.getEmployees({ status: 'Active' as any, limit: 100 }).subscribe({
      next: (response: any) => {
        if (response?.success) {
          const emps = response.data?.employees || response.data || [];
          this.employees.set(emps);
          // Re-set employeeId to trigger z-select to pick up the value after items render
          const currentId = this.employeeId();
          if (currentId) {
            this.employeeId.set(null);
            setTimeout(() => this.employeeId.set(currentId), 0);
          }
        }
        this.loadingEmployees.set(false);
      },
      error: () => this.loadingEmployees.set(false)
    });
  }

  onEmployeeChange(publicId: any): void {
    this.employeeId.set(publicId);
    const emp = this.employees().find(e => e.public_id === publicId);
    this.selectedEmployeeName.set(emp?.full_name ?? null);
    // Reload today's attendance for the selected employee
    this.resetState();
    this.loadTodayAttendance();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private startClock(): void {
    this.currentTime.set(new Date());
    this.clockInterval = setInterval(() => {
      this.currentTime.set(new Date());
      this.updateLiveHours();
    }, 1000);
  }

  private updateLiveHours(): void {
    if (this.isClockedIn() && this.clockInTime()) {
      const clockIn = new Date(this.clockInTime()!);
      const diffMs = new Date().getTime() - clockIn.getTime();
      this.totalHours.set(diffMs / (1000 * 60 * 60));
    }
  }

  private initManualForm(): void {
    this.manualForm = this.fb.group({
      todo_notes: ['']
    });
  }

  // --- Time Picker Helpers ---

  adjustTimeIn(field: 'hour' | 'minute', delta: number): void {
    if (this.todayAttendance()) return;
    if (field === 'hour') {
      let h = this.timeInHour() + delta;
      if (h > 12) h = 1;
      if (h < 1) h = 12;
      this.timeInHour.set(h);
    } else {
      let m = this.timeInMinute() + delta;
      if (m >= 60) m = 0;
      if (m < 0) m = 55;
      this.timeInMinute.set(m);
    }
  }

  adjustTimeOut(field: 'hour' | 'minute', delta: number): void {
    if (field === 'hour') {
      let h = this.timeOutHour() + delta;
      if (h > 12) h = 1;
      if (h < 1) h = 12;
      this.timeOutHour.set(h);
    } else {
      let m = this.timeOutMinute() + delta;
      if (m >= 60) m = 0;
      if (m < 0) m = 55;
      this.timeOutMinute.set(m);
    }
  }

  toggleTimeInPeriod(): void {
    if (this.todayAttendance()) return;
    this.timeInPeriod.set(this.timeInPeriod() === 'AM' ? 'PM' : 'AM');
  }

  toggleTimeOutPeriod(): void {
    this.timeOutPeriod.set(this.timeOutPeriod() === 'AM' ? 'PM' : 'AM');
  }

  private getTime24(hour: number, minute: number, period: 'AM' | 'PM'): string {
    let h = hour;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  padTwo(n: number): string {
    return String(n).padStart(2, '0');
  }

  // --- Load Today ---

  loadTodayAttendance(): void {
    if (!this.employeeId()) return;

    this.attendanceService.getTodayAttendance(this.employeeId()!).subscribe({
      next: (response: any) => {
        if (response?.success) {
          let data: any[] = [];
          if (Array.isArray(response.data)) data = response.data;
          else if (response.data?.attendance) data = response.data.attendance;
          else if (response.data?.data) data = response.data.data;

          if (data.length > 0) {
            const att = data[0];
            this.todayAttendance.set(att);
            this.isClockedIn.set(!att.clock_out_time);
            this.clockInTime.set(att.clock_in_time);
            this.clockOutTime.set(att.clock_out_time || null);
            this.attendanceType.set(att.type);
            this.todoNotes.set(att.todo_notes || '');
            if (att.clock_out_time) this.totalHours.set(att.total_hours || 0);
          } else {
            this.resetState();
          }
        }
      },
      error: () => this.resetState()
    });
  }

  private resetState(): void {
    this.todayAttendance.set(null);
    this.isClockedIn.set(false);
    this.clockInTime.set(null);
    this.clockOutTime.set(null);
    this.totalHours.set(0);
  }

  // --- Clock In/Out ---

  async performClockIn(): Promise<void> {
    if (!this.employeeId() || this.isClockedIn()) return;
    this.loading.set(true);
    this.error.set(null);

    try {
      let location: any = null;
      if (this.attendanceType() === 'Office') {
        try { location = await this.getLocation(); } catch { /* continue */ }
      }

      const request: any = {
        employee_id: this.employeeId()!,
        type: this.attendanceType(),
        todo_notes: this.todoNotes() || undefined
      };
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
            this.emitSuccess();
            setTimeout(() => this.success.set(null), 3000);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || err.message || 'Failed to clock in');
          this.loading.set(false);
        }
      });
    } catch (err: any) {
      this.error.set(err.message || 'An error occurred');
      this.loading.set(false);
    }
  }

  async performClockOut(): Promise<void> {
    if (!this.employeeId() || !this.isClockedIn()) return;
    this.loading.set(true);
    this.error.set(null);

    try {
      let location: any = null;
      if (this.attendanceType() === 'Office') {
        try { location = await this.getLocation(); } catch { /* continue */ }
      }

      const request: any = {
        employee_id: this.employeeId()!,
        todo_notes: this.todoNotes() || undefined
      };
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
            this.emitSuccess();
            setTimeout(() => this.success.set(null), 3000);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || err.message || 'Failed to clock out');
          this.loading.set(false);
        }
      });
    } catch (err: any) {
      this.error.set(err.message || 'An error occurred');
      this.loading.set(false);
    }
  }

  // --- Manual Entry ---

  submitManualEntry(): void {
    if (!this.employeeId() || !this.manualDate()) return;
    this.loading.set(true);
    this.error.set(null);

    const d = this.manualDate()!;
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const timeIn = this.getTime24(this.timeInHour(), this.timeInMinute(), this.timeInPeriod());
    const timeOut = this.getTime24(this.timeOutHour(), this.timeOutMinute(), this.timeOutPeriod());

    const clockIn = new Date(`${date}T${timeIn}:00`);
    const clockOut = new Date(`${date}T${timeOut}:00`);

    this.attendanceService.createManualAttendance({
      employee_id: this.employeeId()!,
      date,
      clock_in_time: clockIn.toISOString(),
      clock_out_time: clockOut.toISOString(),
      type: this.attendanceType(),
      todo_notes: this.manualForm.value.todo_notes || undefined
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.success.set('Attendance recorded successfully!');
          this.emitSuccess();
          setTimeout(() => {
            this.success.set(null);
            this.dialogRef.close();
          }, 1500);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Failed to create attendance');
        this.loading.set(false);
      }
    });
  }

  // --- Helpers ---

  private async getLocation(): Promise<{ lat: number; long: number; address: string }> {
    this.loadingLocation.set(true);
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { this.loadingLocation.set(false); reject(new Error('Not supported')); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.loadingLocation.set(false);
          resolve({ lat: pos.coords.latitude, long: pos.coords.longitude, address: `Lat: ${pos.coords.latitude.toFixed(6)}, Long: ${pos.coords.longitude.toFixed(6)}` });
        },
        (err) => { this.loadingLocation.set(false); reject(err); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  private emitSuccess(): void {
    if (this.modalData?.onSuccess) this.modalData.onSuccess();
  }

  onModeChange(value: string): void { this.activeMode.set(value); }
  onTypeChange(value: string): void { this.attendanceType.set(value as 'Office' | 'WFH'); }
  close(): void { this.dialogRef.close(); }

  formatTime(dateString: string | null): string {
    return this.displayService.formatTime(dateString);
  }

  getHours(): string { return String(Math.floor(this.totalHours())).padStart(2, '0'); }
  getMinutes(): string { return String(Math.floor((this.totalHours() % 1) * 60)).padStart(2, '0'); }
  getSeconds(): string {
    const totalSeconds = this.totalHours() * 3600;
    return String(Math.floor(totalSeconds % 60)).padStart(2, '0');
  }

  getClockHours(): string { return this.currentTime().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }); }
  getClockDate(): string { return this.currentTime().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }

  getStatusBadgeType(): string {
    const att = this.todayAttendance();
    if (!att) return 'soft-gray';
    if (!att.clock_out_time) return 'soft-green';
    if (att.is_late || att.is_early_leave) return 'soft-red';
    return 'soft-green';
  }

  getStatusText(): string {
    const att = this.todayAttendance();
    if (!att) return 'Not Clocked In';
    if (!att.clock_out_time) return 'Clocked In';
    if (att.is_late) return `Late (${att.late_minutes}m)`;
    if (att.is_early_leave) return `Early Leave`;
    return 'Completed';
  }
}
