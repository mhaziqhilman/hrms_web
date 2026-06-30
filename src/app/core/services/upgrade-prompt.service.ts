import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

/**
 * Surfaces an "upgrade required" dialog when the backend rejects a request
 * because of the subscription tier (FEATURE_LOCKED / LIMIT_REACHED /
 * PACKAGE_UNAVAILABLE). Invoked by the package interceptor.
 */
@Injectable({ providedIn: 'root' })
export class UpgradePromptService {
  private dialog = inject(ZardAlertDialogService);
  private router = inject(Router);
  private open = false; // avoid stacking dialogs on bursts of 403s

  show(message: string, feature?: string): void {
    if (this.open) return;
    this.open = true;

    this.dialog.warning({
      zTitle: 'Upgrade required',
      zDescription: message || 'This feature requires a higher plan.',
      zOkText: 'View plans',
      zOnOk: () => {
        this.open = false;
        this.router.navigate(['/upgrade'], feature ? { queryParams: { feature } } : {});
      }
    });

    // Reset the guard shortly after so a later genuine prompt can show.
    setTimeout(() => (this.open = false), 1500);
  }
}
