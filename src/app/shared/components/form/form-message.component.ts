import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ZardFormMessageType = 'default' | 'error' | 'success' | 'warning';

@Component({
  selector: 'z-form-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p [class]="classes()">
      <ng-content></ng-content>
    </p>
  `
})
export class ZardFormMessageComponent {
  @Input() zType: ZardFormMessageType = 'default';

  classes = computed(() => {
    const baseClasses = 'text-xs';

    const typeClasses = {
      default: 'text-muted-foreground',
      error: 'text-destructive',
      success: 'text-green-600',
      warning: 'text-yellow-600'
    };

    return `${baseClasses} ${typeClasses[this.zType]}`;
  });
}
