import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  type TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import type { ClassValue } from 'clsx';
import type { ZardIcon } from '@/shared/components/icon/icons';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardStringTemplateOutletDirective } from '@/shared/core/directives/string-template-outlet/string-template-outlet.directive';
import { mergeClasses } from '@/shared/utils/merge-classes';

@Component({
  selector: 'z-empty',
  standalone: true,
  imports: [NgTemplateOutlet, ZardStringTemplateOutletDirective, ZardIconComponent],
  template: `
    @let icon = zIcon();
    @let image = zImage();
    @let title = zTitle();
    @let description = zDescription();
    @let actions = zActions();

    @if (icon && !image) {
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <z-icon [zType]="icon" class="w-8 h-8 text-muted-foreground" />
      </div>
    }

    @if (image) {
      <div class="mb-4 [&_img]:w-16 [&_img]:h-16">
        <ng-container *zStringTemplateOutlet="image">
          <img [src]="image" alt="" class="w-16 h-16" />
        </ng-container>
      </div>
    }

    @if (title) {
      <h3 class="text-lg font-semibold text-foreground mb-1" data-slot="empty-title">
        <ng-container *zStringTemplateOutlet="title">{{ title }}</ng-container>
      </h3>
    }

    @if (description) {
      <p class="text-sm text-muted-foreground max-w-sm text-center mb-4" data-slot="empty-description">
        <ng-container *zStringTemplateOutlet="description">{{ description }}</ng-container>
      </p>
    }

    @if (actions && actions.length > 0) {
      <div class="flex items-center gap-2" data-slot="empty-actions">
        @for (action of actions; track $index) {
          <ng-container [ngTemplateOutlet]="action" />
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-slot': 'empty',
    '[class]': 'classes()',
  },
  exportAs: 'zEmpty',
})
export class ZardEmptyComponent {
  readonly class = input<ClassValue>('');
  readonly zIcon = input<ZardIcon>();
  readonly zImage = input<string | TemplateRef<void>>();
  readonly zTitle = input<string | TemplateRef<void>>();
  readonly zDescription = input<string | TemplateRef<void>>();
  readonly zActions = input<TemplateRef<void>[]>();

  protected readonly classes = computed(() =>
    mergeClasses(
      'flex flex-col items-center justify-center py-12 px-4',
      this.class(),
    ),
  );
}
