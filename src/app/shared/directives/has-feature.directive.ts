import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { SubscriptionService } from '@/core/services/subscription.service';

/**
 * Structural directive that renders its element only when the current plan
 * unlocks the given feature.
 *
 *   <button *hasFeature="'payroll'" (click)="run()">Run Payroll</button>
 *
 * Re-evaluates reactively when the subscription signal changes.
 */
@Directive({
  selector: '[hasFeature]',
  standalone: true
})
export class HasFeatureDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private subscription = inject(SubscriptionService);

  private featureKey = '';
  private rendered = false;

  constructor() {
    // React to subscription/feature changes.
    effect(() => {
      // Touch the signal so the effect tracks it.
      this.subscription.features();
      this.update();
    });
  }

  @Input()
  set hasFeature(key: string) {
    this.featureKey = key;
    this.update();
  }

  private update(): void {
    const allowed = this.featureKey ? this.subscription.hasFeature(this.featureKey) : true;
    if (allowed && !this.rendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.rendered = true;
    } else if (!allowed && this.rendered) {
      this.viewContainer.clear();
      this.rendered = false;
    }
  }
}
