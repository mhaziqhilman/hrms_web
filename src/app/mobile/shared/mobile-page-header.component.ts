import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mobile-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="flex items-start justify-between gap-3 pb-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 truncate">
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {{ subtitle() }}
          </p>
        }
      </div>
      <ng-content select="[slot=action]" />
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobilePageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
