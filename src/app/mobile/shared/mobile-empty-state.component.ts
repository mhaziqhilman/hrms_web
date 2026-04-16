import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import type { ZardIcon } from '@/shared/components/icon/icons';

@Component({
  selector: 'app-mobile-empty-state',
  standalone: true,
  imports: [ZardIconComponent],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
      >
        <z-icon [zType]="icon()" zSize="lg"></z-icon>
      </div>
      <h3 class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {{ title() }}
      </h3>
      @if (subtitle()) {
        <p class="mt-1 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
          {{ subtitle() }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileEmptyStateComponent {
  readonly icon = input<ZardIcon>('inbox');
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
