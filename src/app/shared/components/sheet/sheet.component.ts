import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { mergeClasses } from '@/shared/utils/merge-classes';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

import { sheetOverlayVariants, sheetVariants, type SheetSide } from './sheet.variants';
import { ZARD_ICONS } from '@/shared/components/icon/icons';

@Component({
  selector: 'z-sheet',
  standalone: true,
  imports: [ZardButtonComponent, ZardIconComponent],
  template: `
    @if (visible()) {
      <!-- Backdrop -->
      <div
        [class]="overlayClasses()"
        [class.z-sheet-overlay-enter]="!closing()"
        [class.z-sheet-overlay-leave]="closing()"
        (click)="close()">
      </div>

      <!-- Panel -->
      <div
        [class]="panelClasses()"
        [class.z-sheet-enter]="!closing()"
        [class.z-sheet-leave]="closing()"
        [attr.data-side]="zSide()">
        <button
          type="button"
          z-button
          zType="ghost"
          zSize="sm"
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 z-10"
          (click)="close()">
          <z-icon [zType]="closeIcon" class="h-4 w-4" />
        </button>
        <ng-content />
      </div>
    }
  `,
  styles: `
    /* Overlay animations */
    .z-sheet-overlay-enter {
      animation: sheetOverlayIn 300ms ease forwards;
    }
    .z-sheet-overlay-leave {
      animation: sheetOverlayOut 200ms ease forwards;
    }

    @keyframes sheetOverlayIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes sheetOverlayOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    /* Panel animations - Right */
    .z-sheet-enter[data-side="right"] {
      animation: sheetSlideInRight 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .z-sheet-leave[data-side="right"] {
      animation: sheetSlideOutRight 200ms ease forwards;
    }

    @keyframes sheetSlideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    @keyframes sheetSlideOutRight {
      from { transform: translateX(0); }
      to { transform: translateX(100%); }
    }

    /* Panel animations - Left */
    .z-sheet-enter[data-side="left"] {
      animation: sheetSlideInLeft 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .z-sheet-leave[data-side="left"] {
      animation: sheetSlideOutLeft 200ms ease forwards;
    }

    @keyframes sheetSlideInLeft {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    @keyframes sheetSlideOutLeft {
      from { transform: translateX(0); }
      to { transform: translateX(-100%); }
    }

    /* Panel animations - Top */
    .z-sheet-enter[data-side="top"] {
      animation: sheetSlideInTop 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .z-sheet-leave[data-side="top"] {
      animation: sheetSlideOutTop 200ms ease forwards;
    }

    @keyframes sheetSlideInTop {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }
    @keyframes sheetSlideOutTop {
      from { transform: translateY(0); }
      to { transform: translateY(-100%); }
    }

    /* Panel animations - Bottom */
    .z-sheet-enter[data-side="bottom"] {
      animation: sheetSlideInBottom 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .z-sheet-leave[data-side="bottom"] {
      animation: sheetSlideOutBottom 200ms ease forwards;
    }

    @keyframes sheetSlideInBottom {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes sheetSlideOutBottom {
      from { transform: translateY(0); }
      to { transform: translateY(100%); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'z-sheet-host',
  },
})
export class ZardSheetComponent {
  readonly zOpen = input<boolean>(false);
  readonly zSide = input<SheetSide>('right');
  readonly zClass = input<string>('');
  readonly zOpenChange = output<boolean>();

  protected readonly closeIcon = ZARD_ICONS['x'];
  protected visible = signal(false);
  protected closing = signal(false);

  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly document = inject(DOCUMENT);
  private previousBodyOverflow: string | null = null;
  private static openSheetCount = 0;

  constructor() {
    effect(() => {
      const open = this.zOpen();
      if (open) {
        if (this.closeTimer) {
          clearTimeout(this.closeTimer);
          this.closeTimer = null;
        }
        this.visible.set(true);
        this.closing.set(false);
        this.lockBodyScroll();
      } else if (this.visible()) {
        this.closing.set(true);
        this.closeTimer = setTimeout(() => {
          this.visible.set(false);
          this.closing.set(false);
          this.closeTimer = null;
        }, 200);
        this.unlockBodyScroll();
      }
    });

    inject(DestroyRef).onDestroy(() => {
      if (this.previousBodyOverflow !== null) this.unlockBodyScroll();
      if (this.closeTimer) clearTimeout(this.closeTimer);
    });
  }

  private lockBodyScroll(): void {
    if (this.previousBodyOverflow !== null) return;
    const body = this.document.body;
    this.previousBodyOverflow = body.style.overflow;
    ZardSheetComponent.openSheetCount++;
    body.style.overflow = 'hidden';
  }

  private unlockBodyScroll(): void {
    if (this.previousBodyOverflow === null) return;
    ZardSheetComponent.openSheetCount = Math.max(0, ZardSheetComponent.openSheetCount - 1);
    if (ZardSheetComponent.openSheetCount === 0) {
      this.document.body.style.overflow = this.previousBodyOverflow;
    }
    this.previousBodyOverflow = null;
  }

  close(): void {
    this.zOpenChange.emit(false);
  }

  protected overlayClasses = computed(() =>
    mergeClasses(sheetOverlayVariants())
  );

  protected panelClasses = computed(() =>
    mergeClasses(sheetVariants({ side: this.zSide() }), this.zClass())
  );
}

// Structural directives for sheet content
@Directive({
  selector: 'z-sheet-header, [z-sheet-header]',
  standalone: true,
  host: {
    class: 'flex flex-col space-y-2 text-center sm:text-left',
  },
})
export class ZardSheetHeaderDirective {}

@Directive({
  selector: 'z-sheet-title, [z-sheet-title]',
  standalone: true,
  host: {
    class: 'text-lg font-semibold text-foreground',
  },
})
export class ZardSheetTitleDirective {}

@Directive({
  selector: 'z-sheet-description, [z-sheet-description]',
  standalone: true,
  host: {
    class: 'text-sm text-muted-foreground',
  },
})
export class ZardSheetDescriptionDirective {}

@Directive({
  selector: 'z-sheet-footer, [z-sheet-footer]',
  standalone: true,
  host: {
    class: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
  },
})
export class ZardSheetFooterDirective {}

// Convenience array for imports
export const ZardSheetImports = [
  ZardSheetComponent,
  ZardSheetHeaderDirective,
  ZardSheetTitleDirective,
  ZardSheetDescriptionDirective,
  ZardSheetFooterDirective,
] as const;
