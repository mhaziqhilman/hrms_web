import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '@/core/services/auth.service';
import { DisplayService } from '@/core/services/display.service';
import { Attendance } from '../../models/attendance.model';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';
import { ZardSegmentedComponent, type SegmentedOption } from '@/shared/components/segmented/segmented.component';

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
    ZardSegmentedComponent
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
  activeMode = signal<string>('clock'); // 'clock' | 'manual'

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
  todoNotes = signal('');

  // Location
  loadingLocation = signal(false);

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();
    this.employeeId.set(user?.employee?.public_id ?? null);

    this.initManualForm();
    this.startClock();
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
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    this.manualForm = this.fb.group({
      date: [today, Validators.required],
      clock_in_time: ['09:00', Validators.required],
      clock_out_time: ['18:00'],
      todo_notes: ['']
    });
  }

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
        try { location = await this.getLocation(); } catch { /* continue without */ }
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
    if (this.manualForm.invalid || !this.employeeId()) return;
    this.loading.set(true);
    this.error.set(null);

    const f = this.manualForm.value;
    const date = f.date;
    const clockIn = new Date(`${date}T${f.clock_in_time}:00`);
    const clockOut = f.clock_out_time ? new Date(`${date}T${f.clock_out_time}:00`) : undefined;

    this.attendanceService.createManualAttendance({
      employee_id: this.employeeId()!,
      date,
      clock_in_time: clockIn.toISOString(),
      clock_out_time: clockOut?.toISOString(),
      type: this.attendanceType(),
      todo_notes: f.todo_notes || undefined
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
      if (!navigator.geolocation) { this.loadingLocation.set(false); reject(new Error('Geolocation not supported')); return; }
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
