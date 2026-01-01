import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { ZardButtonComponent } from '../button/button.component';
import { ZardIconComponent } from '../icon/icon.component';
import { ZardCalendarComponent } from '../calendar/calendar.component';

export type ZardDatePickerSize = 'sm' | 'default' | 'lg';
export type ZardButtonType = 'default' | 'outline' | 'ghost';

@Component({
  selector: 'z-date-picker',
  standalone: true,
  imports: [
    CommonModule,
    OverlayModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardCalendarComponent
  ],
  template: `
    <div class="relative">
      <button
        type="button"
        z-button
        cdkOverlayOrigin
        #trigger="cdkOverlayOrigin"
        [zType]="zType"
        [zSize]="zSize"
        [disabled]="disabled"
        (click)="toggle()"
        [class]="getTriggerClasses()"
        class="w-full justify-start text-left font-normal">

        <z-icon zType="calendar" class="mr-2 h-4 w-4" />

        @if (selectedDate()) {
          <span>{{ formatDate(selectedDate()!) }}</span>
        } @else {
          <span class="text-muted-foreground">{{ placeholder }}</span>
        }
      </button>

      <!-- Calendar Popover -->
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="isOpen()"
        [cdkConnectedOverlayHasBackdrop]="true"
        [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
        (backdropClick)="close()"
        (detach)="close()">

        <div class="z-50 mt-1 rounded-md border bg-popover p-0 shadow-md outline-none animate-in fade-in-80">
          <z-calendar
            [value]="selectedDate()"
            [minDate]="minDate"
            [maxDate]="maxDate"
            [disabled]="disabled"
            (dateChange)="onDateSelect($event)">
          </z-calendar>
        </div>
      </ng-template>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardDatePickerComponent),
      multi: true
    }
  ]
})
export class ZardDatePickerComponent implements ControlValueAccessor {
  @Input() placeholder = 'Pick a date';
  @Input() zFormat = 'MMMM d, yyyy';
  @Input() minDate?: Date;
  @Input() maxDate?: Date;
  @Input() disabled = false;
  @Input() zSize: ZardDatePickerSize = 'default';
  @Input() zType: ZardButtonType = 'outline';

  @Output() dateChange = new EventEmitter<Date | null>();

  selectedDate = signal<Date | null>(null);
  isOpen = signal(false);

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  toggle() {
    if (!this.disabled) {
      this.isOpen.set(!this.isOpen());
    }
  }

  close() {
    this.isOpen.set(false);
  }

  onDateSelect(date: Date | null) {
    this.selectedDate.set(date);
    this.onChange(date);
    this.dateChange.emit(date);
    this.onTouched();
    this.close();
  }

  formatDate(date: Date): string {
    // Simple date formatting - can be enhanced with date-fns or similar
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (this.zFormat === 'MMMM d, yyyy') {
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } else if (this.zFormat === 'MM/dd/yyyy') {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}/${day}/${date.getFullYear()}`;
    } else if (this.zFormat === 'dd-MM-yyyy') {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}-${month}-${date.getFullYear()}`;
    } else if (this.zFormat === 'yyyy-MM-dd') {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}`;
    }

    // Default format
    return date.toLocaleDateString();
  }

  getTriggerClasses(): string {
    return this.selectedDate() ? '' : '';
  }

  // ControlValueAccessor implementation
  writeValue(value: Date | string | null): void {
    if (value) {
      this.selectedDate.set(value instanceof Date ? value : new Date(value));
    } else {
      this.selectedDate.set(null);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
