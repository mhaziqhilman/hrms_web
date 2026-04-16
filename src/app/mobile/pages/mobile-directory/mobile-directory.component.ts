import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { EmployeeService } from '@/features/employees/services/employee.service';
import type { Employee } from '@/features/employees/models/employee.model';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';
import { MobileEmptyStateComponent } from '@/mobile/shared/mobile-empty-state.component';

@Component({
  selector: 'app-mobile-directory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardIconComponent,
    MobilePageHeaderComponent,
    MobileEmptyStateComponent,
  ],
  template: `
    <section class="space-y-4">
      <app-mobile-page-header title="Team" subtitle="Find and contact colleagues" />

      <div class="relative">
        <z-icon zType="search" zSize="sm" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"></z-icon>
        <input
          [formControl]="search"
          type="text"
          placeholder="Search by name, role, department"
          class="w-full rounded-2xl border border-neutral-200 bg-white pl-10 pr-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/15"
        />
      </div>

      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-16 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
          }
        </div>
      } @else if (filtered().length === 0) {
        <app-mobile-empty-state icon="users" title="No matches" subtitle="Try a different search term." />
      } @else {
        <div class="space-y-2">
          @for (emp of filtered(); track emp.id) {
            <div class="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
              @if (emp.photo_url) {
                <img [src]="emp.photo_url" alt="" class="h-11 w-11 rounded-full object-cover border border-neutral-200 dark:border-neutral-700" />
              } @else {
                <div class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-semibold text-white">
                  {{ initials(emp.full_name) }}
                </div>
              }
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{{ emp.full_name }}</div>
                <div class="text-xs text-neutral-500 truncate">
                  {{ emp.position || '—' }}@if (emp.department) { · {{ emp.department }} }
                </div>
              </div>
              <div class="flex gap-1">
                @if (emp.mobile) {
                  <a [href]="'tel:' + emp.mobile" class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 active:scale-90" aria-label="Call">
                    <z-icon zType="smartphone" zSize="sm"></z-icon>
                  </a>
                }
                @if (emp.email) {
                  <a [href]="'mailto:' + emp.email" class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 active:scale-90" aria-label="Email">
                    <z-icon zType="send" zSize="sm"></z-icon>
                  </a>
                }
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileDirectoryComponent implements OnInit {
  private employeeService = inject(EmployeeService);

  readonly search = new FormControl<string>('', { nonNullable: true });
  readonly loading = signal(false);
  readonly all = signal<Employee[]>([]);

  private readonly searchSignal = signal('');

  readonly filtered = computed(() => {
    const q = this.searchSignal().trim().toLowerCase();
    if (!q) return this.all();
    return this.all().filter((e) => {
      const hay = `${e.full_name} ${e.position || ''} ${e.department || ''} ${e.email || ''}`.toLowerCase();
      return hay.includes(q);
    });
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.employeeService.getEmployees({ page: 1, limit: 100 } as any).subscribe({
      next: (res: any) => {
        const items: Employee[] = res?.data?.employees || res?.data || [];
        this.all.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.search.valueChanges.subscribe((v) => this.searchSignal.set(v || ''));
  }

  initials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  }
}
