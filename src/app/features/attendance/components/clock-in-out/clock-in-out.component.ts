import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '@/core/services/auth.service';
import { Attendance } from '../../models/attendance.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';

@Component({
  selector: 'app-clock-in-out',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent
  ],
  templateUrl: './clock-in-out.component.html',
  styleUrl: './clock-in-out.component.css'
})
export class ClockInOutComponent implements OnInit, OnDestroy {
  // Current time display
  currentTime = signal(new Date());
  private clockInterval?: any;

  // Attendance state
  isClockedIn = signal(false);
  clockInTime = signal<string | null>(null);
  clockOutTime = signal<string | null>(null);
  totalHours = signal<number>(0);
  attendanceType = signal<'Office' | 'WFH'>('Office');
  todayAttendance = signal<Attendance | null>(null);

  // Location
  locationPermission = signal<'granted' | 'denied' | 'prompt'>('prompt');
  currentLocation = signal<{ lat: number; long: number; address: string } | null>(null);
  loadingLocation = signal(false);

  // UI State
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Employee - from auth service
  employeeId = signal<number | null>(null);

  constructor(
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

    // Check geolocation permission
    this.checkGeolocationPermission();

    // Load today's attendance
    this.loadTodayAttendance();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  updateClock(): void {
    this.currentTime.set(new Date());
  }

  updateTotalHours(): void {
    if (this.isClockedIn() && this.clockInTime()) {
      const clockIn = new Date(this.clockInTime()!);
      const now = new Date();
      const diffMs = now.getTime() - clockIn.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      this.totalHours.set(hours);
    }
  }

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

          const location = { lat, long, address };
          this.currentLocation.set(location);
          this.loadingLocation.set(false);
          resolve(location);
        },
        (error) => {
          this.loadingLocation.set(false);
          let errorMessage = 'Unable to retrieve location';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              this.locationPermission.set('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }

          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  loadTodayAttendance(): void {
    if (!this.employeeId()) return;

    console.log('=== Loading Today Attendance ===');
    console.log('Employee ID:', this.employeeId());

    this.attendanceService.getTodayAttendance(this.employeeId()!).subscribe({
      next: (response: any) => {
        console.log('Today Attendance API Response:', response);

        if (response.success) {
          // The response now returns a paginated structure like attendance list
          let attendanceArray: any[] = [];

          // Check if data is an array
          if (Array.isArray(response.data)) {
            attendanceArray = response.data;
          } else if (response.data && typeof response.data === 'object') {
            // Check for nested array (same as attendance list)
            if (response.data.attendance && Array.isArray(response.data.attendance)) {
              attendanceArray = response.data.attendance;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              attendanceArray = response.data.data;
            }
          }

          console.log('Attendance array:', attendanceArray);

          // Get the first (and only) attendance record for today
          if (attendanceArray.length > 0) {
            const attendance = attendanceArray[0];
            console.log('Attendance data:', attendance);

            this.todayAttendance.set(attendance);
            this.isClockedIn.set(!attendance.clock_out_time);
            this.clockInTime.set(attendance.clock_in_time);
            this.clockOutTime.set(attendance.clock_out_time || null);
            this.attendanceType.set(attendance.type);

            console.log('Is clocked in:', this.isClockedIn());
            console.log('Clock in time:', this.clockInTime());
            console.log('Clock out time:', this.clockOutTime());

            if (attendance.clock_out_time) {
              this.totalHours.set(attendance.total_hours || 0);
            }
          } else {
            console.log('No attendance record found for today');
            // Reset states - no attendance for today
            this.todayAttendance.set(null);
            this.isClockedIn.set(false);
            this.clockInTime.set(null);
            this.clockOutTime.set(null);
          }
        } else {
          console.log('API response success is false');
          // Reset states
          this.todayAttendance.set(null);
          this.isClockedIn.set(false);
          this.clockInTime.set(null);
          this.clockOutTime.set(null);
        }
      },
      error: (err: any) => {
        console.error('=== Today Attendance API Error ===');
        console.error('Error:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.error?.message || err.message);

        // Reset states on error
        this.todayAttendance.set(null);
        this.isClockedIn.set(false);
        this.clockInTime.set(null);
        this.clockOutTime.set(null);
      }
    });
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
      // Get location for Office attendance
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

      // Prepare clock-in request
      const request: any = {
        employee_id: this.employeeId()!,
        type: this.attendanceType()
      };

      if (location) {
        request.location_lat = location.lat;
        request.location_long = location.long;
        request.location_address = location.address;
      }

      // Call API
      this.attendanceService.clockIn(request).subscribe({
        next: (response) => {
          console.log('Clock in response:', response);

          if (response.success && response.data) {
            this.todayAttendance.set(response.data);
            this.isClockedIn.set(true);
            this.clockInTime.set(response.data.clock_in_time);
            this.success.set('Clocked in successfully!');

            console.log('Clock in successful, is clocked in:', this.isClockedIn());

            // Clear success message after 3 seconds
            setTimeout(() => this.success.set(null), 3000);

            // Reload today's attendance to ensure state is synced
            setTimeout(() => this.loadTodayAttendance(), 500);
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          this.error.set(err.error?.message || 'Failed to clock in');
          this.loading.set(false);
          console.error('Clock in error:', err);
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
      // Get location for Office attendance
      let location = null;
      if (this.attendanceType() === 'Office') {
        try {
          location = await this.getCurrentLocation();
        } catch (err: any) {
          // Continue without location if it fails
          console.warn('Location unavailable for clock out:', err);
        }
      }

      // Prepare clock-out request
      const request: any = {
        employee_id: this.employeeId()!
      };

      if (location) {
        request.location_lat = location.lat;
        request.location_long = location.long;
        request.location_address = location.address;
      }

      // Call API
      this.attendanceService.clockOut(request).subscribe({
        next: (response) => {
          console.log('Clock out response:', response);

          if (response.success && response.data) {
            this.todayAttendance.set(response.data);
            this.isClockedIn.set(false);
            this.clockOutTime.set(response.data.clock_out_time || null);
            this.totalHours.set(response.data.total_hours || 0);
            this.success.set('Clocked out successfully!');

            console.log('Clock out successful, is clocked in:', this.isClockedIn());

            // Clear success message after 3 seconds
            setTimeout(() => this.success.set(null), 3000);

            // Reload today's attendance to ensure state is synced
            setTimeout(() => this.loadTodayAttendance(), 500);
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          this.error.set(err.error?.message || 'Failed to clock out');
          this.loading.set(false);
          console.error('Clock out error:', err);
        }
      });
    } catch (err: any) {
      this.error.set(err.message || 'An unexpected error occurred');
      this.loading.set(false);
    }
  }

  getStatusClass(): string {
    const attendance = this.todayAttendance();
    if (!attendance) return 'status-none';

    if (attendance.is_late && attendance.is_early_leave) return 'status-danger';
    if (attendance.is_late) return 'status-warning';
    if (attendance.is_early_leave) return 'status-info';
    return 'status-success';
  }

  getStatusText(): string {
    const attendance = this.todayAttendance();
    if (!attendance) return 'Not Clocked In';

    if (!attendance.clock_out_time) return 'Working';

    if (attendance.is_late && attendance.is_early_leave) {
      const lateMin = attendance.late_minutes || 0;
      const earlyMin = attendance.early_leave_minutes || 0;
      return `Late (${lateMin}m) & Early Leave (${earlyMin}m)`;
    }
    if (attendance.is_late) {
      const lateMin = attendance.late_minutes || 0;
      return `Late (${lateMin} minutes)`;
    }
    if (attendance.is_early_leave) {
      const earlyMin = attendance.early_leave_minutes || 0;
      return `Early Leave (${earlyMin} minutes)`;
    }
    return 'On Time';
  }

  formatTime(dateString: string | null): string {
    if (!dateString) return '--:--';

    const date = new Date(dateString);
    return date.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  formatCurrentTime(): string {
    return this.currentTime().toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  formatCurrentDate(): string {
    return this.currentTime().toLocaleDateString('en-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
