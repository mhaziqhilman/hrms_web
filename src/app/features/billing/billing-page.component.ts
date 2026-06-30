import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';

import { SubscriptionService } from '@/core/services/subscription.service';
import { SubscriptionHistoryEntry, UsageMetric } from '@/core/models/subscription.models';

@Component({
  selector: 'app-billing-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardDividerComponent
  ],
  template: `
    <div class="space-y-6 max-w-3xl">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-[28px] font-semibold tracking-tight leading-none">Billing &amp; Plan</h1>
          <p class="text-[13px] text-muted-foreground mt-2">Manage your subscription and view usage.</p>
        </div>
        <button z-button zType="default" routerLink="/upgrade">
          <z-icon zType="arrow-up" class="w-4 h-4 mr-2" />
          View plans
        </button>
      </div>

      <!-- Current plan card -->
      <div class="rounded-xl border bg-card p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <z-icon zType="badge-check" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-semibold">{{ subscription.planName() }}</h2>
                <z-badge [zType]="$any(statusBadge())">{{ statusLabel() }}</z-badge>
              </div>
              <p class="text-[12px] text-muted-foreground mt-0.5">
                {{ subscription.currentPackage()?.description || 'Full access to your HR workspace.' }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold">{{ priceLabel() }}</div>
            @if (trialEnds()) {
              <p class="text-[12px] text-muted-foreground">Trial ends {{ trialEnds() | date:'mediumDate' }}</p>
            }
          </div>
        </div>
      </div>

      <!-- Usage meters -->
      <div class="rounded-xl border bg-card p-6">
        <h3 class="text-sm font-semibold mb-4">Usage</h3>
        <div class="space-y-5">
          <div>
            <div class="flex items-center justify-between text-[13px] mb-1.5">
              <span class="flex items-center gap-2">
                <z-icon zType="building-2" class="w-4 h-4 text-muted-foreground" /> Companies owned
              </span>
              <span class="text-muted-foreground">{{ usageLabel(companies()) }}</span>
            </div>
            <div class="h-2 rounded-full bg-muted overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" [style.width.%]="usagePct(companies())"></div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between text-[13px] mb-1.5">
              <span class="flex items-center gap-2">
                <z-icon zType="users" class="w-4 h-4 text-muted-foreground" /> Employees (active company)
              </span>
              <span class="text-muted-foreground">{{ usageLabel(employees()) }}</span>
            </div>
            <div class="h-2 rounded-full bg-muted overflow-hidden">
              <div class="h-full bg-primary rounded-full transition-all" [style.width.%]="usagePct(employees())"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- History -->
      <div class="rounded-xl border bg-card p-6">
        <h3 class="text-sm font-semibold mb-4">Plan history</h3>
        @if (history().length === 0) {
          <p class="text-[13px] text-muted-foreground">No plan changes yet.</p>
        } @else {
          <div class="space-y-3">
            @for (h of history(); track h.id) {
              <div class="flex items-center gap-3 text-[13px]">
                <div class="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <z-icon [zType]="$any(actionIcon(h.action))" class="w-3.5 h-3.5" />
                </div>
                <div class="flex-1">
                  <span class="font-medium capitalize">{{ h.action.replace('_', ' ') }}</span>
                  @if (h.to_package) { <span class="text-muted-foreground"> → {{ h.to_package.name }}</span> }
                  @if (h.reason) { <p class="text-[12px] text-muted-foreground">{{ h.reason }}</p> }
                </div>
                <span class="text-[12px] text-muted-foreground shrink-0">{{ h.created_at | date:'mediumDate' }}</span>
              </div>
              <z-divider zSpacing="none" />
            }
          </div>
        }
      </div>
    </div>
  `
})
export class BillingPageComponent implements OnInit {
  subscription = inject(SubscriptionService);

  history = signal<SubscriptionHistoryEntry[]>([]);

  ngOnInit(): void {
    this.subscription.loadSubscription().subscribe({ error: () => {} });
    this.subscription.loadHistory().subscribe({
      next: (h) => this.history.set(h),
      error: () => {}
    });
  }

  companies(): UsageMetric | undefined {
    return this.subscription.usage()?.['max_companies'];
  }
  employees(): UsageMetric | undefined {
    return this.subscription.usage()?.['max_employees_per_company'];
  }

  usageLabel(m: UsageMetric | undefined): string {
    if (!m) return '—';
    return m.limit === -1 ? `${m.current} / ∞` : `${m.current} / ${m.limit}`;
  }

  usagePct(m: UsageMetric | undefined): number {
    if (!m || m.limit === -1 || m.limit === 0) return m && m.current > 0 ? 8 : 0;
    return Math.min(100, Math.round((m.current / m.limit) * 100));
  }

  statusLabel(): string {
    const s = this.subscription.currentSubscription()?.status ?? 'active';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  statusBadge(): string {
    const s = this.subscription.currentSubscription()?.status;
    if (s === 'trialing') return 'secondary';
    if (s === 'past_due' || s === 'expired' || s === 'canceled') return 'destructive';
    return 'default';
  }

  priceLabel(): string {
    const pkg = this.subscription.currentPackage();
    const n = pkg ? (typeof pkg.price_monthly === 'string' ? parseFloat(pkg.price_monthly) : pkg.price_monthly) : 0;
    return n === 0 ? 'Free' : `RM ${n.toFixed(0)}/mo`;
  }

  trialEnds(): string | null {
    return this.subscription.currentSubscription()?.trial_ends_at ?? null;
  }

  actionIcon(action: string): string {
    switch (action) {
      case 'created': return 'sparkles';
      case 'upgraded': return 'arrow-up';
      case 'downgraded': return 'arrow-down';
      case 'canceled': return 'x';
      case 'trial_started': return 'star';
      case 'trial_ended': return 'clock';
      case 'admin_override': return 'shield';
      default: return 'circle';
    }
  }
}
