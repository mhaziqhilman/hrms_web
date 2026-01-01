import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardIconComponent } from '../icon/icon.component';

@Component({
  selector: 'z-select-item',
  standalone: true,
  imports: [CommonModule, ZardIconComponent],
  template: `
    <div
      role="option"
      [attr.aria-selected]="isSelected()"
      [attr.aria-disabled]="zDisabled"
      [class]="getItemClasses()"
      class="relative flex items-center gap-2 w-full cursor-pointer select-none rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">

      <!-- Checkmark Icon (when selected) -->
      @if (isSelected()) {
        <z-icon zType="check" class="w-4 h-4 flex-shrink-0" />
      } @else {
        <span class="w-4"></span>
      }

      <!-- Item Content -->
      <span class="flex-1 truncate">
        <ng-content></ng-content>
      </span>
    </div>
  `,
  host: {
    '[attr.data-disabled]': 'zDisabled ? "" : null'
  }
})
export class ZardSelectItemComponent {
  @Input() zValue: any;
  @Input() zDisabled = false;

  @Output() clicked = new EventEmitter<void>();

  isSelected = signal(false);

  constructor(private elementRef: ElementRef) {}

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (!this.zDisabled) {
      event.stopPropagation();
      this.clicked.emit();
    }
  }

  setSelected(selected: boolean) {
    this.isSelected.set(selected);
  }

  getLabel(): string {
    return this.elementRef.nativeElement.textContent?.trim() || '';
  }

  getItemClasses(): string {
    return this.zDisabled ? 'opacity-50 cursor-not-allowed' : '';
  }
}
