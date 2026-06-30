import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTableImports } from '@/shared/components/table/table.imports';

import { AdminSubscriptionService } from './admin-subscriptions.service';
import { AdminSubscriptionRow } from '@/core/models/subscription.models';

@Component({
  selector: 'app-admin-subscriptions-page',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardMenuImports,
    ZardTableImports
  ],
  template: `
    <div class="space-y-5">
      <div>
        <h1 class="text-[28px] font-semibold tracking-tight leading-none">Subscriptions</h1>
        <p class="text-[13px] text-muted-foreground mt-2">
          Manage every user's plan. Override to Professional / Enterprise for internal testing even while they're "Coming Soon".
        </p>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1 max-w-xs">
          <z-icon zType="search" class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search by email…"
            class="w-full h-9 pl-10 pr-3 rounded-md border bg-background text-sm"
            [value]="search()"
            (input)="onSearch($any($event.target).value)"
          />
        </div>
        <select class="h-9 px-3 rounded-md border bg-background text-sm" [value]="packageFilter()" (change)="onPackageFilter($any($event.target).value)">
          <option value="">All plans</option>
          <option value="basic">Basic</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <!-- Table -->
      <div class="rounded-xl border bg-card overflow-hidden">
        <table z-table class="w-full">
          <thead z-table-header>
            <tr z-table-row>
              <th z-table-head>User</th>
              <th z-table-head>Plan</th>
              <th z-table-head>Status</th>
              <th z-table-head>Role</th>
              <th z-table-head class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody z-table-body>
            @if (loading()) {
              <tr z-table-row><td z-table-cell colspan="5" class="text-center text-sm text-muted-foreground py-8">Loading…</td></tr>
            } @else if (rows().length === 0) {
              <tr z-table-row><td z-table-cell colspan="5" class="text-center text-sm text-muted-foreground py-8">No subscriptions found.</td></tr>
            } @else {
              @for (row of rows(); track row.id) {
                <tr z-table-row>
                  <td z-table-cell>
                    <div class="font-medium">{{ row.user?.email }}</div>
                  </td>
                  <td z-table-cell>
                    <z-badge [zType]="$any(planBadge(row))">{{ row.package?.name || '—' }}</z-badge>
                  </td>
                  <td z-table-cell>
                    <span class="text-[13px] capitalize">{{ row.status }}</span>
                  </td>
                  <td z-table-cell>
                    <span class="text-[13px] capitalize text-muted-foreground">{{ row.user?.role }}</span>
                  </td>
                  <td z-table-cell class="text-right">
                    <div z-menu [zMenuTriggerFor]="actions" zPlacement="bottomRight">
                      <button z-button zType="ghost" zSize="sm">
                        <z-icon zType="ellipsis" class="w-4 h-4" />
                      </button>
                    </div>
                    <ng-template #actions>
                      <button type="button" z-menu-item (click)="setPlan(row, 'basic')">
                        <z-icon zType="circle" class="w-4 h-4 mr-2" /> Set Basic
                      </button>
                      <button type="button" z-menu-item (click)="setPlan(row, 'professional')">
                        <z-icon zType="arrow-up" class="w-4 h-4 mr-2" /> Set Professional
                      </button>
                      <button type="button" z-menu-item (click)="setPlan(row, 'enterprise')">
                        <z-icon zType="building-2" class="w-4 h-4 mr-2" /> Set Enterprise
                      </button>
                      <button type="button" z-menu-item (click)="grantTrial(row)">
                        <z-icon zType="star" class="w-4 h-4 mr-2" /> Grant Pro trial
                      </button>
                    </ng-template>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="flex items-center justify-between text-[13px]">
          <span class="text-muted-foreground">Page {{ page() }} of {{ totalPages() }} · {{ total() }} total</span>
          <div class="flex gap-2">
            <button z-button zType="outline" zSize="sm" [disabled]="page() <= 1" (click)="go(page() - 1)">
              <z-icon zType="chevron-left" class="w-4 h-4" />
            </button>
            <button z-button zType="outline" zSize="sm" [disabled]="page() >= totalPages()" (click)="go(page() + 1)">
              <z-icon zType="chevron-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminSubscriptionsPageComponent implements OnInit {
  private service = inject(AdminSubscriptionService);

  loading = signal(true);
  rows = signal<AdminSubscriptionRow[]>([]);
  page = signal(1);
  totalPages = signal(1);
  total = signal(0);
  search = signal('');
  packageFilter = signal('');
  private searchTimeout: any;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service
      .list({
        page: this.page(),
        limit: 20,
        search: this.search() || undefined,
        packageSlug: this.packageFilter() || undefined
      })
      .subscribe({
        next: (res) => {
          this.rows.set(res.data || []);
          if (res.pagination) {
            this.totalPages.set(res.pagination.totalPages);
            this.total.set(res.pagination.total);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onSearch(value: string): void {
    this.search.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, 350);
  }

  onPackageFilter(value: string): void {
    this.packageFilter.set(value);
    this.page.set(1);
    this.load();
  }

  go(p: number): void {
    this.page.set(p);
    this.load();
  }

  setPlan(row: AdminSubscriptionRow, slug: string): void {
    if (!row.user) return;
    this.service.override(row.user.id, slug, `Set to ${slug} via admin panel`).subscribe({
      next: () => this.load(),
      error: () => {}
    });
  }

  grantTrial(row: AdminSubscriptionRow): void {
    if (!row.user) return;
    this.service.grantTrial(row.user.id, 'professional').subscribe({
      next: () => this.load(),
      error: () => {}
    });
  }

  planBadge(row: AdminSubscriptionRow): string {
    switch (row.package?.slug) {
      case 'enterprise': return 'default';
      case 'professional': return 'secondary';
      default: return 'outline';
    }
  }
}
