import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList,
  AfterContentInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  forwardRef,
  signal,
  computed,
  HostListener,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule, CdkConnectedOverlay } from '@angular/cdk/overlay';
import { ZardIconComponent } from '../icon/icon.component';
import { ZardBadgeComponent } from '../badge/badge.component';
import { ZardSelectItemComponent } from './select-item.component';

export type ZardSelectSize = 'sm' | 'default' | 'lg';

@Component({
  selector: 'z-select',
  standalone: true,
  imports: [CommonModule, OverlayModule, ZardIconComponent, ZardBadgeComponent],
  host: { class: 'block' },
  template: `
    <div class="relative w-full">
      <!-- Trigger Button -->
      <button
        #trigger
        type="button"
        [disabled]="zDisabled"
        (click)="toggleDropdown()"
        [class]="getTriggerClasses()"
        class="w-full flex items-center justify-between gap-2 px-3 rounded-md border border-input bg-background text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">

        <!-- Selected Value Display -->
        <div class="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
          @if (displayLabels().length > 0) {
            @if (zMultiple && displayLabels().length > 0) {
              <!-- Multiple Selection - Show Badges -->
              <div class="flex items-center gap-1 flex-wrap">
                @for (label of displayLabels(); track label) {
                  <z-badge zType="secondary" zSize="sm" class="text-xs">
                    {{ label }}
                  </z-badge>
                }
                @if (remainingCount() > 0) {
                  <z-badge zType="secondary" zSize="sm" class="text-xs">
                    +{{ remainingCount() }}
                  </z-badge>
                }
              </div>
            } @else {
              <!-- Single Selection -->
              <span class="truncate text-left">{{ displayLabels()[0] }}</span>
            }
          } @else {
            <!-- Placeholder -->
            <span class="truncate text-muted-foreground text-left">{{ zPlaceholder }}</span>
          }
        </div>

        <!-- Chevron Icon -->
        <z-icon
          [zType]="isOpen() ? 'chevron-up' : 'chevron-down'"
          class="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>

      <!-- Dropdown Overlay -->
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="isOpen()"
        [cdkConnectedOverlayHasBackdrop]="true"
        [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
        (backdropClick)="closeDropdown()"
        (detach)="closeDropdown()">

        <div
          #dropdown
          role="listbox"
          [attr.aria-multiselectable]="zMultiple"
          [style.width.px]="dropdownWidth()"
          class="z-50 mt-1 rounded-md border border-input bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-80">

          <div class="max-h-60 overflow-y-auto p-1">
            <ng-content></ng-content>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardSelectComponent),
      multi: true
    }
  ]
})
export class ZardSelectComponent implements ControlValueAccessor, AfterContentInit, OnChanges {
  @Input() zDisabled = false;
  @Input() zLabel?: string;
  @Input() zMaxLabelCount = 1;
  @Input() zMultiple = false;
  @Input() zPlaceholder = 'Select an option...';
  @Input() zSize: ZardSelectSize = 'default';
  @Input() zValue: any = null;

  @Output() zValueChange = new EventEmitter<any>();
  @Output() zSelectionChange = new EventEmitter<any>();

  @ViewChild('trigger', { static: false }) triggerRef!: ElementRef;
  @ViewChild('dropdown', { static: false }) dropdownRef?: ElementRef;

  @ContentChildren(ZardSelectItemComponent, { descendants: true })
  items!: QueryList<ZardSelectItemComponent>;

  isOpen = signal(false);
  selectedValue = signal<any>(null);
  selectedValues = signal<any[]>([]);
  dropdownWidth = signal<number | undefined>(undefined);

  displayLabels = computed(() => {
    if (this.zMultiple) {
      const labels: string[] = [];
      const values = this.selectedValues();

      for (const value of values) {
        const item = this.items?.find(i => i.zValue === value);
        if (item) {
          labels.push(item.getLabel());
          if (labels.length >= this.zMaxLabelCount) break;
        }
      }
      return labels;
    } else {
      const value = this.selectedValue();
      if (value !== null && value !== undefined) {
        const item = this.items?.find(i => i.zValue === value);
        return item ? [item.getLabel()] : [];
      }
      return [];
    }
  });

  remainingCount = computed(() => {
    if (!this.zMultiple) return 0;
    const total = this.selectedValues().length;
    return Math.max(0, total - this.zMaxLabelCount);
  });

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['zValue']) {
      const value = changes['zValue'].currentValue;
      if (this.zMultiple) {
        this.selectedValues.set(Array.isArray(value) ? value : []);
      } else {
        this.selectedValue.set(value);
      }
      this.updateItemStates();
    }
  }

  ngAfterContentInit() {
    // Subscribe to item clicks
    this.items.forEach(item => {
      item.clicked.subscribe(() => this.onItemClick(item));
    });

    // Update item selected states
    this.items.changes.subscribe(() => {
      this.updateItemStates();
      this.items.forEach(item => {
        item.clicked.subscribe(() => this.onItemClick(item));
      });
    });

    this.updateItemStates();
  }

  toggleDropdown() {
    if (this.zDisabled) return;

    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.isOpen.set(true);

    // Calculate dropdown width based on trigger
    setTimeout(() => {
      if (this.triggerRef) {
        const width = this.triggerRef.nativeElement.offsetWidth;
        this.dropdownWidth.set(width);
      }
    });
  }

  closeDropdown() {
    this.isOpen.set(false);
  }

  onItemClick(item: ZardSelectItemComponent) {
    if (item.zDisabled) return;

    if (this.zMultiple) {
      // Multiple selection
      const values = [...this.selectedValues()];
      const index = values.indexOf(item.zValue);

      if (index > -1) {
        values.splice(index, 1);
      } else {
        values.push(item.zValue);
      }

      this.selectedValues.set(values);
      this.zValue = values;
      this.onChange(values);
      this.zValueChange.emit(values);
      this.zSelectionChange.emit(values);
    } else {
      // Single selection
      this.selectedValue.set(item.zValue);
      this.zValue = item.zValue;
      this.onChange(item.zValue);
      this.zValueChange.emit(item.zValue);
      this.zSelectionChange.emit(item.zValue);
      this.closeDropdown();
    }

    this.updateItemStates();
    this.onTouched();
  }

  updateItemStates() {
    if (!this.items) return;

    this.items.forEach(item => {
      if (this.zMultiple) {
        item.setSelected(this.selectedValues().includes(item.zValue));
      } else {
        item.setSelected(item.zValue === this.selectedValue());
      }
    });
  }

  getTriggerClasses(): string {
    const sizeClasses = {
      sm: 'min-h-8 py-1 text-xs',
      default: 'min-h-9 py-1.5 text-sm',
      lg: 'min-h-10 py-2 text-base'
    };

    return sizeClasses[this.zSize] || sizeClasses.default;
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (this.zMultiple) {
      this.selectedValues.set(Array.isArray(value) ? value : []);
    } else {
      this.selectedValue.set(value);
    }
    this.zValue = value;
    this.updateItemStates();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.zDisabled = isDisabled;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen()) {
      this.closeDropdown();
    }
  }
}
