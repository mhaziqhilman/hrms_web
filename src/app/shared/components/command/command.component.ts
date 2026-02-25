import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
  AfterContentInit,
  effect,
} from '@angular/core';
import { mergeClasses } from '@/shared/utils/merge-classes';

// ─── Command Option ───────────────────────────────────────────────
@Component({
  selector: 'z-command-option',
  standalone: true,
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.data-value]': 'zValue()',
    '[attr.data-disabled]': 'zDisabled() || undefined',
    '[attr.data-selected]': 'selected() || undefined',
    '[attr.role]': '"option"',
    '(click)': 'onSelect()',
    '(mouseenter)': 'selected.set(true)',
    '(mouseleave)': 'selected.set(false)',
  },
})
export class ZardCommandOptionComponent {
  readonly zValue = input.required<string>();
  readonly zLabel = input.required<string>();
  readonly zIcon = input<string>();
  readonly zShortcut = input<string>();
  readonly zDisabled = input<boolean>(false);
  readonly zKeywords = input<string[]>([]);
  readonly class = input<string>('');

  readonly selected = signal(false);
  readonly hidden = signal(false);

  readonly classes = computed(() =>
    mergeClasses(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
      this.selected() ? 'bg-accent text-accent-foreground' : '',
      this.zDisabled() ? 'pointer-events-none opacity-50' : '',
      this.hidden() ? 'hidden' : '',
      this.class()
    )
  );

  readonly optionSelected = output<{ value: string; label: string }>();

  onSelect(): void {
    if (!this.zDisabled()) {
      this.optionSelected.emit({ value: this.zValue(), label: this.zLabel() });
    }
  }

  matchesSearch(term: string): boolean {
    if (!term) return true;
    const lower = term.toLowerCase();
    return (
      this.zLabel().toLowerCase().includes(lower) ||
      this.zValue().toLowerCase().includes(lower) ||
      this.zKeywords().some(k => k.toLowerCase().includes(lower))
    );
  }
}

// ─── Command Option Group ─────────────────────────────────────────
@Component({
  selector: 'z-command-option-group',
  standalone: true,
  template: `
    @if (!hidden()) {
      <div class="overflow-hidden p-1 text-foreground">
        <div class="px-2 py-1.5 text-xs font-medium text-muted-foreground">{{ zLabel() }}</div>
        <ng-content />
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': '"group"',
    '[attr.aria-label]': 'zLabel()',
  },
})
export class ZardCommandOptionGroupComponent {
  readonly zLabel = input.required<string>();
  readonly hidden = signal(false);
  readonly options = contentChildren(ZardCommandOptionComponent);
}

// ─── Command Empty ────────────────────────────────────────────────
@Component({
  selector: 'z-command-empty',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="py-6 text-center text-sm text-muted-foreground">
        <ng-content />
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardCommandEmptyComponent {
  readonly visible = signal(false);
}

// ─── Command List ─────────────────────────────────────────────────
@Component({
  selector: 'z-command-list',
  standalone: true,
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"max-h-[300px] overflow-y-auto overflow-x-hidden"',
    '[attr.role]': '"listbox"',
  },
})
export class ZardCommandListComponent {}

// ─── Command Divider ──────────────────────────────────────────────
@Component({
  selector: 'z-command-divider',
  standalone: true,
  template: `<div class="-mx-1 h-px bg-border"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardCommandDividerComponent {}

// ─── Command Input ────────────────────────────────────────────────
@Component({
  selector: 'z-command-input',
  standalone: true,
  template: `
    <div class="flex items-center border-b px-3">
      <svg class="mr-2 h-4 w-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
      </svg>
      <input
        #inputEl
        class="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        [placeholder]="placeholder()"
        (input)="onInput($event)"
        (keydown)="keydown.emit($event)"
        autocomplete="off"
        spellcheck="false"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZardCommandInputComponent {
  readonly placeholder = input<string>('Type a command or search...');
  readonly valueChange = output<string>();
  readonly keydown = output<KeyboardEvent>();
  readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  focus(): void {
    this.inputEl()?.nativeElement.focus();
  }

  clear(): void {
    const el = this.inputEl()?.nativeElement;
    if (el) {
      el.value = '';
      this.valueChange.emit('');
    }
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.valueChange.emit(value);
  }
}

// ─── Command (Main Container) ─────────────────────────────────────
@Component({
  selector: 'z-command',
  standalone: true,
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
  },
})
export class ZardCommandComponent implements AfterContentInit {
  readonly class = input<string>('');
  readonly zCommandSelected = output<{ value: string; label: string }>();

  readonly classes = computed(() =>
    mergeClasses(
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
      this.class()
    )
  );

  readonly groups = contentChildren(ZardCommandOptionGroupComponent, { descendants: true });
  readonly emptyComponent = contentChildren(ZardCommandEmptyComponent, { descendants: true });
  readonly commandInput = contentChildren(ZardCommandInputComponent, { descendants: true });

  private searchTerm = signal('');

  constructor() {
    effect(() => {
      const term = this.searchTerm();
      const groups = this.groups();
      const empties = this.emptyComponent();

      let totalVisible = 0;

      for (const group of groups) {
        let groupVisible = 0;
        for (const option of group.options()) {
          const matches = option.matchesSearch(term);
          option.hidden.set(!matches);
          if (matches) groupVisible++;
        }
        group.hidden.set(groupVisible === 0);
        totalVisible += groupVisible;
      }

      for (const empty of empties) {
        empty.visible.set(totalVisible === 0 && term.length > 0);
      }
    });
  }

  ngAfterContentInit(): void {
    // Wire up input valueChange to search
    for (const input of this.commandInput()) {
      input.valueChange.subscribe((term: string) => {
        this.searchTerm.set(term);
      });
    }

    // Wire up option selections
    for (const group of this.groups()) {
      for (const option of group.options()) {
        option.optionSelected.subscribe((event: { value: string; label: string }) => {
          this.zCommandSelected.emit(event);
        });
      }
    }
  }

  filterByTerm(term: string): void {
    this.searchTerm.set(term);
  }

  focus(): void {
    const inputs = this.commandInput();
    if (inputs.length > 0) {
      inputs[0].focus();
    }
  }
}
