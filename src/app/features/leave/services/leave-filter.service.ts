import { Injectable, computed, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Employee } from '../../employees/models/employee.model';
import { Leave, LeaveStatus } from '../models/leave.model';

export type BulkLeaveAction = 'approve' | 'reject' | 'clear';

/**
 * Shared filter state for the Leave module's tabbed page (dashboard / list / calendar).
 *
 * The picker + year selector + list filters live on the parent leave-page card; child
 * tabs read filter values from here and reload on change.
 */
@Injectable({ providedIn: 'root' })
export class LeaveFilterService {
  // Dashboard scope: which employee + which year
  readonly selectedEmployeeId = signal<string | null>(null);
  readonly selectedYear = signal<number>(new Date().getFullYear());

  // List scope: date range + status
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly status = signal<LeaveStatus | ''>('');

  // Shared employee directory (loaded once by the page)
  readonly employees = signal<Employee[]>([]);

  readonly selectedEmployee = computed(() => {
    const id = this.selectedEmployeeId();
    return this.employees().find((e) => e.public_id === id) ?? null;
  });

  setEmployees(list: Employee[]): void {
    this.employees.set(list);
  }

  setSelectedEmployeeId(id: string | null): void {
    this.selectedEmployeeId.set(id);
  }

  setSelectedYear(year: number): void {
    this.selectedYear.set(year);
  }

  setStartDate(date: string): void {
    this.startDate.set(date);
  }

  setEndDate(date: string): void {
    this.endDate.set(date);
  }

  setStatus(status: LeaveStatus | ''): void {
    this.status.set(status);
  }

  clearListFilters(): void {
    this.startDate.set('');
    this.endDate.set('');
    this.status.set('');
  }

  // ── Selection state (list-tab bulk actions) ───────────────────
  readonly selectedLeaves = signal<Leave[]>([]);

  readonly canBulkApprove = computed(
    () => this.selectedLeaves().some((l) => l.status === LeaveStatus.PENDING)
  );

  readonly canBulkReject = computed(
    () => this.selectedLeaves().some((l) => l.status === LeaveStatus.PENDING)
  );

  setSelectedLeaves(leaves: Leave[]): void {
    this.selectedLeaves.set(leaves);
  }

  clearSelection(): void {
    this.selectedLeaves.set([]);
  }

  // Bulk action request channel — list component listens, page emits.
  private readonly _bulkAction = new Subject<BulkLeaveAction>();
  readonly bulkAction$: Observable<BulkLeaveAction> = this._bulkAction.asObservable();

  requestBulkAction(action: BulkLeaveAction): void {
    this._bulkAction.next(action);
  }
}
