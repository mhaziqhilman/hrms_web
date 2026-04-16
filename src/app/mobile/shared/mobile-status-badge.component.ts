import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type MobileStatusTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'neutral';

@Component({
  selector: 'app-mobile-status-badge',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      [class]="toneClasses()"
    >
      <span class="h-1.5 w-1.5 rounded-full" [class]="dotClasses()"></span>
      <span>{{ label() }}</span>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileStatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<MobileStatusTone>('neutral');

  protected readonly toneClasses = computed(() => {
    switch (this.tone()) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'amber':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
      case 'rose':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
      case 'sky':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300';
      case 'violet':
        return 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300';
      default:
        return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
    }
  });

  protected readonly dotClasses = computed(() => {
    switch (this.tone()) {
      case 'emerald':
        return 'bg-emerald-500';
      case 'amber':
        return 'bg-amber-500';
      case 'rose':
        return 'bg-rose-500';
      case 'sky':
        return 'bg-sky-500';
      case 'violet':
        return 'bg-violet-500';
      default:
        return 'bg-neutral-400';
    }
  });
}
