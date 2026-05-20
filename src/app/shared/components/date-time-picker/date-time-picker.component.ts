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
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { ZardButtonComponent } from '../button/button.component';
import { ZardIconComponent } from '../icon/icon.component';
import { ZardCalendarComponent } from '../calendar/calendar.component';

export type ZardDateTimePickerSize = 'sm' | 'default' | 'lg';
export type ZardButtonType = 'default' | 'outline' | 'ghost';

/**
 * Combined date + time picker — a calendar alongside hour / minute / AM·PM
 * scroll columns in a single popover. Stores & emits a `Date`.
 */
@Component({
  selector: 'z-date-time-picker',
  standalone: true,
  imports: [CommonModule, OverlayModule, ZardButtonComponent, ZardIconComponent, ZardCalendarComponent],
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
        class="w-full justify-start text-left font-light">

        <z-icon zType="calendar" class="mr-2 h-4 w-4" />

        @if (selectedDate()) {
          <span class="tabular-nums">{{ displayLabel() }}</span>
        } @else {
          <span class="text-muted-foreground">{{ placeholder }}</span>
        }
      </button>

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="isOpen()"
        [cdkConnectedOverlayPositions]="overlayPositions"
        [cdkConnectedOverlayHasBackdrop]="true"
        [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
        (backdropClick)="close()"
        (detach)="close()">

        <div class="z-dtp-panel z-50 rounded-md border bg-popover shadow-md outline-none animate-in fade-in-80">
          <div class="flex items-stretch">

            <!-- Calendar -->
            <z-calendar
              [value]="selectedDate()"
              [minDate]="minDate"
              [maxDate]="maxDate"
              [disabled]="disabled"
              (dateChange)="onCalendarSelect($event)">
            </z-calendar>

            <!-- Time columns -->
            <div class="flex h-[300px] self-center border-l divide-x">
              <!-- Hours -->
              <div class="z-dtp-scroll w-[46px] overflow-y-auto p-1 flex flex-col gap-0.5">
                @for (h of hours; track h) {
                  <button type="button" (click)="selectHour(h)"
                    [class]="cellClass(isHourActive(h))"
                    class="h-8 w-full shrink-0 rounded-md text-[13px] font-medium tabular-nums transition-colors grid place-items-center">
                    {{ h }}
                  </button>
                }
              </div>
              <!-- Minutes -->
              <div class="z-dtp-scroll w-[46px] overflow-y-auto p-1 flex flex-col gap-0.5">
                @for (m of minuteOptions(); track m) {
                  <button type="button" (click)="selectMinute(m)"
                    [class]="cellClass(isMinuteActive(m))"
                    class="h-8 w-full shrink-0 rounded-md text-[13px] font-medium tabular-nums transition-colors grid place-items-center">
                    {{ pad(m) }}
                  </button>
                }
              </div>
              <!-- AM / PM -->
              <div class="w-[46px] p-1 flex flex-col gap-0.5">
                @for (p of periods; track p) {
                  <button type="button" (click)="selectPeriod(p)"
                    [class]="cellClass(isPeriodActive(p))"
                    class="h-8 w-full shrink-0 rounded-md text-[11.5px] font-semibold transition-colors grid place-items-center">
                    {{ p }}
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .z-dtp-scroll { scrollbar-width: thin; scroll-behavior: smooth; }
    .z-dtp-scroll::-webkit-scrollbar { width: 6px; }
    .z-dtp-scroll::-webkit-scrollbar-thumb {
      background-color: rgb(148 163 184 / 0.4);
      border-radius: 3px;
    }
    .z-dtp-scroll::-webkit-scrollbar-track { background: transparent; }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardDateTimePickerComponent),
      multi: true
    }
  ]
})
export class ZardDateTimePickerComponent implements ControlValueAccessor {
  @Input() placeholder = 'MM/DD/YYYY hh:mm aa';
  @Input() minDate?: Date;
  @Input() maxDate?: Date;
  @Input() disabled = false;
  @Input() zSize: ZardDateTimePickerSize = 'default';
  @Input() zType: ZardButtonType = 'outline';
  @Input() minuteStep = 5;

  @Output() dateChange = new EventEmitter<Date | null>();

  isOpen = signal(false);
  selectedDate = signal<Date | null>(null);

  hours = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  periods: Array<'AM' | 'PM'> = ['AM', 'PM'];

  // Open below the trigger; flip above when there isn't enough room
  overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 }
  ];

  minuteOptions = computed<number[]>(() => {
    const step = Math.min(60, Math.max(1, this.minuteStep));
    const set = new Set<number>();
    for (let m = 0; m < 60; m += step) set.add(m);
    const d = this.selectedDate();
    if (d) set.add(d.getMinutes());
    return Array.from(set).sort((a, b) => a - b);
  });

  displayLabel = computed(() => {
    const d = this.selectedDate();
    if (!d) return '';
    let h = d.getHours() % 12;
    if (h === 0) h = 12;
    const ap = d.getHours() >= 12 ? 'PM' : 'AM';
    return `${this.pad(d.getMonth() + 1)}/${this.pad(d.getDate())}/${d.getFullYear()} ${this.pad(h)}:${this.pad(d.getMinutes())} ${ap}`;
  });

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  cellClass(active: boolean): string {
    return active
      ? 'is-active bg-primary text-primary-foreground hover:bg-primary'
      : 'text-foreground hover:bg-accent hover:text-accent-foreground';
  }

  isHourActive(h: number): boolean {
    const d = this.selectedDate();
    return !!d && d.getHours() % 12 === h % 12;
  }

  isMinuteActive(m: number): boolean {
    const d = this.selectedDate();
    return !!d && d.getMinutes() === m;
  }

  isPeriodActive(p: 'AM' | 'PM'): boolean {
    const d = this.selectedDate();
    if (!d) return false;
    return p === 'PM' ? d.getHours() >= 12 : d.getHours() < 12;
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    this.isOpen.set(true);
    setTimeout(() => {
      const panel = document.querySelector('.z-dtp-panel');
      panel?.querySelectorAll('.z-dtp-scroll').forEach(col => {
        const c = col as HTMLElement;
        const active = c.querySelector('.is-active') as HTMLElement | null;
        if (active) {
          c.scrollTop = active.offsetTop - c.clientHeight / 2 + active.clientHeight / 2;
        }
      });
    });
  }

  close(): void {
    this.isOpen.set(false);
    this.onTouched();
  }

  onCalendarSelect(date: Date | null): void {
    if (!date) return;
    const cur = this.selectedDate();
    const next = new Date(date);
    if (cur) {
      next.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
    } else {
      next.setHours(0, 0, 0, 0);
    }
    this.commit(next);
  }

  selectHour(h: number): void {
    const d = this.ensureDate();
    const isPM = d.getHours() >= 12;
    d.setHours((h % 12) + (isPM ? 12 : 0));
    this.commit(d);
  }

  selectMinute(m: number): void {
    const d = this.ensureDate();
    d.setMinutes(m);
    this.commit(d);
  }

  selectPeriod(p: 'AM' | 'PM'): void {
    const d = this.ensureDate();
    const h = d.getHours();
    if (p === 'PM' && h < 12) d.setHours(h + 12);
    if (p === 'AM' && h >= 12) d.setHours(h - 12);
    this.commit(d);
  }

  /** Returns a fresh, mutable Date — current selection or today at 00:00. */
  private ensureDate(): Date {
    const cur = this.selectedDate();
    if (cur) return new Date(cur);
    const d = new Date();
    d.setSeconds(0, 0);
    return d;
  }

  private commit(date: Date | null): void {
    this.selectedDate.set(date);
    this.onChange(date);
    this.dateChange.emit(date);
  }

  // ControlValueAccessor
  writeValue(value: Date | string | null): void {
    if (value) {
      const d = value instanceof Date ? value : new Date(value);
      this.selectedDate.set(isNaN(d.getTime()) ? null : d);
    } else {
      this.selectedDate.set(null);
    }
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
