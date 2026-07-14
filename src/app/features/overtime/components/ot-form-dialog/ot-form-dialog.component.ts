import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { Employee } from '../../../employees/models/employee.model';
import { OvertimeService } from '../../services/overtime.service';
import { OvertimeDayType } from '../../models/overtime.model';

export interface OtFormDialogData {
  employeeId?: string;
  onSuccess?: () => void;
}

const SELF = '__self__';

@Component({
  selector: 'app-ot-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardDatePickerComponent
  ],
  templateUrl: './ot-form-dialog.component.html',
  styleUrls: ['./ot-form-dialog.component.css']
})
export class OtFormDialogComponent implements OnInit {
  private auth = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private overtimeService = inject(OvertimeService);
  private dialogRef = inject(ZardDialogRef);
  private data = inject(Z_MODAL_DATA, { optional: true }) as OtFormDialogData | null;

  readonly SELF = SELF;
  readonly dayTypes: { value: OvertimeDayType; label: string; mult: number }[] = [
    { value: 'normal', label: 'Weekday', mult: 1.5 },
    { value: 'rest_day', label: 'Rest Day', mult: 2.0 },
    { value: 'public_holiday', label: 'Public Holiday', mult: 3.0 }
  ];

  isPrivileged = false;
  employees = signal<Employee[]>([]);
  submitting = signal(false);

  // Form state (signals — mirrors the clock-in dialog approach)
  employeeId = signal<string>(SELF);
  otDate = signal<Date>(new Date());
  dayType = signal<OvertimeDayType>('normal');
  reason = signal<string>('');

  // Time steppers (12-hour, same UX as the clock-in form). Defaults 7:00 PM → 9:00 PM.
  startHour = signal(7);
  startMinute = signal(0);
  startPeriod = signal<'AM' | 'PM'>('PM');
  endHour = signal(9);
  endMinute = signal(0);
  endPeriod = signal<'AM' | 'PM'>('PM');

  ngOnInit(): void {
    const role = this.auth.getCurrentUserValue()?.role ?? '';
    this.isPrivileged = ['super_admin', 'admin', 'manager'].includes(role);
    if (this.data?.employeeId) this.employeeId.set(this.data.employeeId);

    if (this.isPrivileged) {
      this.employeeService.getEmployees({ limit: 200, status: 'Active' }).subscribe({
        next: (res) => this.employees.set(res.data?.employees ?? []),
        error: () => this.employees.set([])
      });
    }
    this.detectDayType();
  }

  selectedBasic = computed(() => {
    const id = this.employeeId();
    if (id === SELF) return null;
    const emp = this.employees().find(e => e.public_id === id);
    return emp ? Number(emp.basic_salary) : null;
  });

  onDateChange(d: Date | null): void {
    if (d) this.otDate.set(d);
    this.detectDayType();
  }

  private detectDayType(): void {
    const date = this.formatDate(this.otDate());
    if (!date) return;
    this.overtimeService.suggestDayType(date).subscribe({
      next: (res) => { if (res.data) this.dayType.set(res.data.day_type); }
    });
  }

  // --- Time stepper handlers (mirror clock-in dialog) ---
  adjustStart(field: 'hour' | 'minute', delta: number): void {
    if (field === 'hour') {
      let h = this.startHour() + delta; if (h > 12) h = 1; if (h < 1) h = 12; this.startHour.set(h);
    } else {
      let m = this.startMinute() + delta; if (m >= 60) m = 0; if (m < 0) m = 55; this.startMinute.set(m);
    }
  }
  adjustEnd(field: 'hour' | 'minute', delta: number): void {
    if (field === 'hour') {
      let h = this.endHour() + delta; if (h > 12) h = 1; if (h < 1) h = 12; this.endHour.set(h);
    } else {
      let m = this.endMinute() + delta; if (m >= 60) m = 0; if (m < 0) m = 55; this.endMinute.set(m);
    }
  }
  toggleStartPeriod(): void { this.startPeriod.set(this.startPeriod() === 'AM' ? 'PM' : 'AM'); }
  toggleEndPeriod(): void { this.endPeriod.set(this.endPeriod() === 'AM' ? 'PM' : 'AM'); }
  padTwo(n: number): string { return String(n).padStart(2, '0'); }

  private to24(hour: number, minute: number, period: 'AM' | 'PM'): string {
    let h = hour;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  private minutesOf(hour: number, minute: number, period: 'AM' | 'PM'): number {
    let h = hour;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + minute;
  }

  private formatDate(d: Date): string {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  get durationHours(): number {
    let mins = this.minutesOf(this.endHour(), this.endMinute(), this.endPeriod())
             - this.minutesOf(this.startHour(), this.startMinute(), this.startPeriod());
    if (mins < 0) mins += 24 * 60;
    return Math.round((mins / 60) * 100) / 100;
  }

  get durationLabel(): string {
    const h = Math.floor(this.durationHours);
    const m = Math.round((this.durationHours - h) * 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }

  get multiplier(): number {
    return this.dayTypes.find(d => d.value === this.dayType())?.mult ?? 1.5;
  }

  get hourlyRate(): number | null {
    const basic = this.selectedBasic();
    return basic ? Math.round((basic / 26 / 8) * 100) / 100 : null;
  }

  get estimate(): number | null {
    const hr = this.hourlyRate;
    if (hr === null) return null;
    return Math.round(this.durationHours * this.multiplier * hr * 100) / 100;
  }

  close(): void { this.dialogRef.close(); }

  submit(): void {
    const dateStr = this.formatDate(this.otDate());
    if (!dateStr) { toast.error('Please choose an overtime date'); return; }
    if (this.durationHours <= 0) { toast.error('End time must be after start time'); return; }

    this.submitting.set(true);
    const empId = this.employeeId();
    this.overtimeService.submitOvertime({
      employee_id: empId && empId !== SELF ? empId : undefined,
      date: dateStr,
      hours: this.durationHours,
      start_time: this.to24(this.startHour(), this.startMinute(), this.startPeriod()),
      end_time: this.to24(this.endHour(), this.endMinute(), this.endPeriod()),
      day_type: this.dayType(),
      reason: this.reason() || undefined,
      source: 'manual'
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        toast.success('Overtime request submitted');
        this.data?.onSuccess?.();
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.submitting.set(false);
        toast.error(err?.error?.message || 'Failed to submit overtime request');
      }
    });
  }
}
