import { Directive, input, model, computed, HostListener } from '@angular/core';

export type ZardInputSize = 'sm' | 'default' | 'lg';
export type ZardInputStatus = 'error' | 'warning' | 'success';

@Directive({
  selector: 'input[z-input], textarea[z-input]',
  standalone: true,
  host: {
    '[class]': 'classes()'
  },
  exportAs: 'zInput'
})
export class ZardInputDirective {
  readonly customClass = input<string>('', { alias: 'class' });
  readonly zBorderless = input(false);
  readonly zSize = input<ZardInputSize>('default');
  readonly zStatus = input<ZardInputStatus | undefined>(undefined);
  readonly value = model<string>('');

  classes = computed(() => {
    const baseClasses = 'flex w-full rounded-md border bg-background px-3 py-2 text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

    // Size classes
    const sizeClasses = {
      sm: 'h-8 text-xs',
      default: 'h-9 text-sm',
      lg: 'h-10 text-base'
    };

    // Status classes
    const statusClasses = {
      error: 'border-destructive focus-visible:ring-destructive',
      warning: 'border-yellow-500 focus-visible:ring-yellow-500',
      success: 'border-green-500 focus-visible:ring-green-500'
    };

    // Borderless classes
    const borderlessClasses = this.zBorderless()
      ? 'border-0 focus-visible:ring-0 focus-visible:ring-offset-0'
      : 'border-input';

    const sizeClass = sizeClasses[this.zSize()];
    const statusClass = this.zStatus() ? statusClasses[this.zStatus()!] : '';
    const customClass = this.customClass();

    return `${baseClasses} ${sizeClass} ${borderlessClasses} ${statusClass} ${customClass}`.trim();
  });

  @HostListener('input', ['$event.target'])
  updateValue(target: any) {
    this.value.set(target.value);
  }
}
