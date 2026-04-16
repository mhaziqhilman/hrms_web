import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '@/core/services/auth.service';
import { ClaimService } from '@/features/claims/services/claim.service';
import type { Claim } from '@/features/claims/models/claim.model';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';
import {
  MobileStatusBadgeComponent,
  MobileStatusTone,
} from '@/mobile/shared/mobile-status-badge.component';
import { MobileEmptyStateComponent } from '@/mobile/shared/mobile-empty-state.component';

@Component({
  selector: 'app-mobile-claims',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardIconComponent,
    MobilePageHeaderComponent,
    MobileStatusBadgeComponent,
    MobileEmptyStateComponent,
  ],
  template: `
    <section class="space-y-5">
      <app-mobile-page-header title="Claims" subtitle="Submit and track expenses">
        <a
          slot="action"
          routerLink="/m/claims/submit"
          class="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-500/30 active:scale-95 transition"
        >
          <z-icon zType="plus" zSize="sm"></z-icon>
          New
        </a>
      </app-mobile-page-header>

      <!-- Summary card -->
      <div class="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-xl shadow-amber-500/20">
        <div class="text-xs uppercase tracking-wider opacity-80">Total pending</div>
        <div class="mt-1 flex items-baseline gap-1">
          <span class="text-4xl font-bold tabular-nums">{{ pendingAmount() | number:'1.2-2' }}</span>
          <span class="text-sm opacity-80">MYR</span>
        </div>
        <div class="mt-3 flex items-center gap-4 text-xs opacity-90">
          <div>{{ pendingCount() }} pending</div>
          <div class="h-1 w-1 rounded-full bg-white/40"></div>
          <div>{{ approvedCount() }} approved</div>
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-24 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
          }
        </div>
      } @else if (claims().length === 0) {
        <app-mobile-empty-state
          icon="receipt-text"
          title="No claims yet"
          subtitle="Submit your first expense claim with a receipt photo."
        />
      } @else {
        <div class="space-y-2">
          @for (claim of claims(); track claim.id) {
            <div class="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                      {{ claim.claimType?.name || 'Claim' }}
                    </span>
                  </div>
                  <div class="mt-0.5 text-xs text-neutral-500">{{ formatDate(claim.date) }}</div>
                  @if (claim.description) {
                    <p class="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {{ claim.description }}
                    </p>
                  }
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-base font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                    {{ Number(claim.amount) | number:'1.2-2' }}
                  </div>
                  <div class="text-[10px] text-neutral-500">MYR</div>
                </div>
              </div>
              <div class="mt-3 flex items-center justify-between">
                <app-mobile-status-badge [label]="statusLabel(claim.status)" [tone]="statusTone(claim.status)" />
                @if (claim.receipt_url) {
                  <z-icon zType="file-text" zSize="sm" class="text-neutral-400"></z-icon>
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
export class MobileClaimsComponent implements OnInit {
  private auth = inject(AuthService);
  private claimService = inject(ClaimService);

  readonly loading = signal(false);
  readonly claims = signal<Claim[]>([]);
  readonly pendingAmount = signal(0);
  readonly pendingCount = signal(0);
  readonly approvedCount = signal(0);

  // expose Number to template
  protected readonly Number = Number;

  ngOnInit(): void {
    const eid = this.auth.currentUserSignal()?.employee?.id;
    if (!eid) return;
    this.loading.set(true);
    this.claimService.getAllClaims({ employee_id: eid, page: 1, limit: 30 }).subscribe({
      next: (res) => {
        const items = res.data || [];
        this.claims.set(items);
        this.pendingAmount.set(
          items
            .filter((c) => c.status === 'Pending' || c.status === 'Manager_Approved')
            .reduce((sum, c) => sum + Number(c.amount || 0), 0),
        );
        this.pendingCount.set(items.filter((c) => c.status === 'Pending').length);
        this.approvedCount.set(
          items.filter((c) => c.status === 'Finance_Approved' || c.status === 'Paid').length,
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(s: string): string {
    switch (s) {
      case 'Pending':
        return 'Pending';
      case 'Manager_Approved':
        return 'Manager OK';
      case 'Finance_Approved':
        return 'Finance OK';
      case 'Rejected':
        return 'Rejected';
      case 'Paid':
        return 'Paid';
      default:
        return s;
    }
  }

  statusTone(s: string): MobileStatusTone {
    switch (s) {
      case 'Pending':
        return 'amber';
      case 'Manager_Approved':
        return 'sky';
      case 'Finance_Approved':
      case 'Paid':
        return 'emerald';
      case 'Rejected':
        return 'rose';
      default:
        return 'neutral';
    }
  }

  formatDate(s: string): string {
    return new Date(s).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
