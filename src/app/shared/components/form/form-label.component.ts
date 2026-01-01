import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'label[z-form-label]',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-content></ng-content>
    @if (zRequired) {
      <span class="text-destructive ml-1">*</span>
    }
  `,
  host: {
    class: 'text-sm font-semibold text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
  }
})
export class ZardFormLabelComponent {
  @Input() zRequired = false;
}
