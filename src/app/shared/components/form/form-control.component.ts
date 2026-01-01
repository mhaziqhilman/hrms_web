import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardFormMessageComponent } from './form-message.component';

@Component({
  selector: 'z-form-control',
  standalone: true,
  imports: [CommonModule, ZardFormMessageComponent],
  template: `
    <div class="relative">
      <ng-content></ng-content>
      @if (errorMessage) {
        <z-form-message zType="error" class="mt-1">
          {{ errorMessage }}
        </z-form-message>
      }
      @if (helpText && !errorMessage) {
        <z-form-message class="mt-1">
          {{ helpText }}
        </z-form-message>
      }
    </div>
  `
})
export class ZardFormControlComponent {
  @Input() errorMessage?: string;
  @Input() helpText?: string;
}
