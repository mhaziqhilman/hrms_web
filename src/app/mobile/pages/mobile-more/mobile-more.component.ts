import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '@/core/services/auth.service';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import type { ZardIcon } from '@/shared/components/icon/icons';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';

interface MoreLink {
  path: string;
  label: string;
  sublabel: string;
  icon: ZardIcon;
  tone: 'violet' | 'emerald' | 'sky' | 'amber' | 'rose' | 'neutral';
}

@Component({
  selector: 'app-mobile-more',
  standalone: true,
  imports: [CommonModule, RouterLink, ZardIconComponent, MobilePageHeaderComponent],
  template: `
    <section class="space-y-5">
      <app-mobile-page-header title="More" />

      <!-- Primary section -->
      <div class="grid grid-cols-2 gap-3">
        @for (link of primary(); track link.path) {
          <a [routerLink]="link.path" class="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 active:scale-98 transition">
            <span
              class="inline-flex h-10 w-10 items-center justify-center rounded-xl"
              [class]="toneBg(link.tone)"
            >
              <z-icon [zType]="link.icon" zSize="default" [class]="toneText(link.tone)"></z-icon>
            </span>
            <div>
              <div class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ link.label }}</div>
              <div class="mt-0.5 text-xs text-neutral-500">{{ link.sublabel }}</div>
            </div>
          </a>
        }
      </div>

      <!-- Secondary section -->
      <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        @for (link of secondary(); track link.path) {
          <a [routerLink]="link.path" class="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-0 dark:border-neutral-800 active:bg-neutral-50 dark:active:bg-neutral-800/60">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl" [class]="toneBg(link.tone)">
              <z-icon [zType]="link.icon" zSize="sm" [class]="toneText(link.tone)"></z-icon>
            </span>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-neutral-900 dark:text-neutral-50">{{ link.label }}</div>
              <div class="text-xs text-neutral-500 truncate">{{ link.sublabel }}</div>
            </div>
            <z-icon zType="chevron-right" zSize="sm" class="text-neutral-400"></z-icon>
          </a>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileMoreComponent {
  private auth = inject(AuthService);

  private readonly isManager = computed(() => {
    const role = this.auth.currentUserSignal()?.role;
    return role === 'manager' || role === 'admin' || role === 'super_admin';
  });

  readonly primary = computed<MoreLink[]>(() => {
    const base: MoreLink[] = [
      { path: '/m/claims', label: 'Claims', sublabel: 'Submit & track', icon: 'credit-card', tone: 'rose' },
      { path: '/m/wfh', label: 'Work from home', sublabel: 'Apply and track', icon: 'house', tone: 'violet' },
      { path: '/m/payslip', label: 'Payslips', sublabel: 'View & download', icon: 'wallet', tone: 'emerald' },
      { path: '/m/announcements', label: 'Announcements', sublabel: "What's new", icon: 'send', tone: 'sky' },
      { path: '/m/directory', label: 'Team directory', sublabel: 'Find colleagues', icon: 'users', tone: 'amber' },
    ];
    if (this.isManager()) {
      base.unshift({
        path: '/m/approvals',
        label: 'Approvals',
        sublabel: 'Review requests',
        icon: 'circle-check',
        tone: 'rose',
      });
    }
    return base;
  });

  readonly secondary = computed<MoreLink[]>(() => [
    { path: '/m/documents', label: 'Documents', sublabel: 'Your files', icon: 'file', tone: 'neutral' },
    { path: '/m/notifications', label: 'Notifications', sublabel: 'All activity', icon: 'bell', tone: 'neutral' },
    { path: '/m/profile', label: 'Profile', sublabel: 'Account & settings', icon: 'circle-user', tone: 'neutral' },
  ]);

  toneBg(t: MoreLink['tone']): string {
    switch (t) {
      case 'violet': return 'bg-violet-100 dark:bg-violet-950/40';
      case 'emerald': return 'bg-emerald-100 dark:bg-emerald-950/40';
      case 'sky': return 'bg-sky-100 dark:bg-sky-950/40';
      case 'amber': return 'bg-amber-100 dark:bg-amber-950/40';
      case 'rose': return 'bg-rose-100 dark:bg-rose-950/40';
      default: return 'bg-neutral-100 dark:bg-neutral-800';
    }
  }

  toneText(t: MoreLink['tone']): string {
    switch (t) {
      case 'violet': return 'text-violet-700 dark:text-violet-300';
      case 'emerald': return 'text-emerald-700 dark:text-emerald-300';
      case 'sky': return 'text-sky-700 dark:text-sky-300';
      case 'amber': return 'text-amber-700 dark:text-amber-300';
      case 'rose': return 'text-rose-700 dark:text-rose-300';
      default: return 'text-neutral-600 dark:text-neutral-400';
    }
  }
}
