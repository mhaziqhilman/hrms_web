import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingBarService {
  private routeLoading = signal(false);
  private httpCount = signal(0);

  readonly isLoading = computed(() => this.routeLoading() || this.httpCount() > 0);

  setRouteLoading(loading: boolean): void {
    this.routeLoading.set(loading);
  }

  startHttp(): void {
    this.httpCount.update(c => c + 1);
  }

  stopHttp(): void {
    this.httpCount.update(c => Math.max(0, c - 1));
  }
}
