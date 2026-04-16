import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-mobile-page-placeholder',
  standalone: true,
  template: `
    <section class="flex flex-col items-center justify-center text-center py-16 space-y-3">
      <div class="text-lg font-semibold">{{ title() }}</div>
      @if (subtitle()) {
        <div class="text-sm text-neutral-500 max-w-xs">{{ subtitle() }}</div>
      }
      <div class="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
        Coming in {{ phase() }}
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobilePagePlaceholderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly phase = input<string>('Phase 3');
}
