import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LeaveRefreshService {
  private readonly _refresh = new Subject<void>();
  readonly refresh$: Observable<void> = this._refresh.asObservable();

  private readonly _applyRequested = new Subject<void>();
  readonly applyRequested$: Observable<void> = this._applyRequested.asObservable();

  emit(): void {
    this._refresh.next();
  }

  requestApply(): void {
    this._applyRequested.next();
  }
}
