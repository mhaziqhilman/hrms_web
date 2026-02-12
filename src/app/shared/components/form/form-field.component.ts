import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'z-form-field',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block min-w-0' },
  template: `
    <div class="grid gap-2">
      <ng-content></ng-content>
    </div>
  `
})
export class ZardFormFieldComponent {}
