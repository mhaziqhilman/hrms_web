import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';

import { SubscriptionService } from '@/core/services/subscription.service';
import { Package } from '@/core/models/subscription.models';

interface FeatureRow {
  key: string;
  label: string;
}

@Component({
  selector: 'app-upgrade-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ZardButtonComponent, ZardIconComponent, ZardBadgeComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="text-center max-w-2xl mx-auto">
        <h1 class="text-[28px] font-semibold tracking-tight leading-none">Plans &amp; Pricing</h1>
        <p class="text-[13px] text-muted-foreground mt-2">
          You're currently on the <span class="font-medium text-foreground">{{ subscription.planName() }}</span> plan.
          Professional and Enterprise are coming soon.
        </p>
      </div>

      <!-- Plan cards -->
      @if (loading()) {
        <div class="text-center text-sm text-muted-foreground py-12">Loading plans…</div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          @for (pkg of packages(); track pkg.slug) {
            <div
              class="relative rounded-xl border bg-card p-6 flex flex-col"
              [class.border-primary]="isCurrent(pkg)"
              [class.shadow-sm]="isCurrent(pkg)"
              [class.opacity-75]="!pkg.is_available && !isCurrent(pkg)"
            >
              <!-- Ribbon -->
              @if (isCurrent(pkg)) {
                <div class="absolute -top-3 left-1/2 -translate-x-1/2">
                  <z-badge zType="default">Current plan</z-badge>
                </div>
              } @else if (!pkg.is_available) {
                <div class="absolute -top-3 left-1/2 -translate-x-1/2">
                  <z-badge [zType]="$any('secondary')">Coming soon</z-badge>
                </div>
              }

              <div class="mb-4">
                <h3 class="text-lg font-semibold">{{ pkg.name }}</h3>
                <p class="text-[12px] text-muted-foreground mt-1 min-h-[32px]">{{ pkg.description }}</p>
              </div>

              <div class="mb-5">
                <span class="text-3xl font-bold">{{ formatPrice(pkg.price_monthly) }}</span>
                <span class="text-sm text-muted-foreground">/ month</span>
                @if (toNumber(pkg.price_yearly) > 0) {
                  <p class="text-[12px] text-muted-foreground mt-1">
                    or {{ formatPrice(pkg.price_yearly) }} / year
                  </p>
                }
              </div>

              <!-- CTA -->
              <div class="mb-5">
                @if (isCurrent(pkg)) {
                  <button z-button zType="outline" class="w-full" [disabled]="true">Your plan</button>
                } @else if (!pkg.is_available) {
                  <button z-button zType="outline" class="w-full" [disabled]="true">
                    <z-icon zType="lock" class="w-4 h-4 mr-2" />
                    Coming soon
                  </button>
                } @else {
                  <button z-button zType="default" class="w-full" (click)="selectPlan(pkg)">
                    Switch to {{ pkg.name }}
                  </button>
                }
              </div>

              <!-- Limits -->
              <div class="space-y-2 text-[13px] mb-4">
                <div class="flex items-center gap-2">
                  <z-icon zType="building-2" class="w-4 h-4 text-muted-foreground" />
                  <span>{{ formatLimit(pkg.limits?.max_companies) }} companies</span>
                </div>
                <div class="flex items-center gap-2">
                  <z-icon zType="users" class="w-4 h-4 text-muted-foreground" />
                  <span>{{ formatLimit(pkg.limits?.max_employees_per_company) }} employees / company</span>
                </div>
                @if (pkg.trial_days > 0) {
                  <div class="flex items-center gap-2">
                    <z-icon zType="star" class="w-4 h-4 text-muted-foreground" />
                    <span>{{ pkg.trial_days }}-day free trial</span>
                  </div>
                }
              </div>

              <!-- Feature checklist -->
              <ul class="space-y-1.5 text-[13px] mt-auto pt-4 border-t">
                @for (row of featureRows; track row.key) {
                  <li class="flex items-center gap-2"
                      [class.text-muted-foreground]="!pkg.features?.[row.key]"
                      [class.opacity-50]="!pkg.features?.[row.key]">
                    <z-icon
                      [zType]="pkg.features?.[row.key] ? 'check' : 'x'"
                      class="w-3.5 h-3.5 shrink-0"
                      [class.text-primary]="pkg.features?.[row.key]"
                    />
                    <span>{{ row.label }}</span>
                  </li>
                }
              </ul>
            </div>
          }
        </div>

        <p class="text-center text-[12px] text-muted-foreground">
          Need a custom plan? <a routerLink="/feedback" class="underline">Contact us</a>.
        </p>
      }
    </div>
  `
})
export class UpgradePageComponent implements OnInit {
  subscription = inject(SubscriptionService);

  loading = signal(true);
  packages = this.subscription.packages;

  // Core features worth showing on the comparison cards.
  featureRows: FeatureRow[] = [
    { key: 'employee_management', label: 'Employee Management' },
    { key: 'leave_management', label: 'Leave Management' },
    { key: 'attendance', label: 'Attendance & WFH' },
    { key: 'claims', label: 'Claims Management' },
    { key: 'payroll', label: 'Payroll System' },
    { key: 'statutory_reports', label: 'Statutory Reports' },
    { key: 'analytics', label: 'Analytics & Charts' },
    { key: 'document_management', label: 'Document Management' },
    { key: 'multi_company', label: 'Multi-Company Switcher' },
    { key: 'audit_log', label: 'Audit Log' },
    { key: 'e_invoice', label: 'e-Invoice' },
    { key: 'priority_support', label: 'Priority Support' }
  ];

  ngOnInit(): void {
    this.subscription.loadPackages().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
    // Make sure we know the current plan for the "Current" ribbon.
    this.subscription.loadSubscription().subscribe({ error: () => {} });
  }

  isCurrent(pkg: Package): boolean {
    return this.subscription.planSlug() === pkg.slug;
  }

  selectPlan(pkg: Package): void {
    this.subscription.changePlan(pkg.slug).subscribe({ error: () => {} });
  }

  toNumber(v: number | string | undefined): number {
    return typeof v === 'string' ? parseFloat(v) : v ?? 0;
  }

  formatPrice(v: number | string | undefined): string {
    const n = this.toNumber(v);
    return n === 0 ? 'Free' : `RM ${n.toFixed(0)}`;
  }

  formatLimit(v: number | undefined): string {
    if (v === undefined || v === null || v === -1) return 'Unlimited';
    return String(v);
  }
}
