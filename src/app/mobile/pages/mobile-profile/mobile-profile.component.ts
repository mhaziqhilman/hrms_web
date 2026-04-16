import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '@/core/services/auth.service';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/core/config/api.config';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import type { ZardIcon } from '@/shared/components/icon/icons';
import { NativeService } from '@/mobile/services/native.service';
import { BiometricService } from '@/mobile/services/biometric.service';
import { PushService } from '@/mobile/services/push.service';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';

@Component({
  selector: 'app-mobile-profile',
  standalone: true,
  imports: [CommonModule, ZardIconComponent, MobilePageHeaderComponent],
  template: `
    <section class="space-y-5">
      <app-mobile-page-header title="Profile" subtitle="Your account and preferences" />

      <!-- Identity card -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl shadow-violet-500/20">
        <div class="flex items-center gap-4">
          @if (user()?.avatar_url && !avatarFailed()) {
            <img
              [src]="user()!.avatar_url"
              alt=""
              class="h-16 w-16 rounded-full border-2 border-white/80 object-cover"
              referrerpolicy="no-referrer"
              (error)="avatarFailed.set(true)"
            />
          } @else {
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-bold backdrop-blur">
              {{ initials() }}
            </div>
          }
          <div class="min-w-0">
            <div class="text-lg font-semibold tracking-tight truncate">
              {{ user()?.employee?.full_name || user()?.email }}
            </div>
            <div class="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium capitalize backdrop-blur">
              {{ user()?.role?.replace('_', ' ') }}
            </div>
          </div>
        </div>

        @if (user()?.employee) {
          <div class="mt-5 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div class="opacity-70">Employee ID</div>
              <div class="mt-0.5 font-semibold">{{ user()?.employee?.employee_id || '—' }}</div>
            </div>
            <div>
              <div class="opacity-70">Department</div>
              <div class="mt-0.5 font-semibold truncate">{{ user()?.employee?.department || '—' }}</div>
            </div>
          </div>
        }
      </div>

      <!-- Preferences -->
      @if (native.isNative && biometricAvailable()) {
        <div>
          <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Security</h2>
          <div class="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <label class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-3">
                <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                  <z-icon zType="shield" zSize="sm"></z-icon>
                </span>
                <span>
                  <span class="block text-sm font-medium">Biometric unlock</span>
                  <span class="block text-xs text-neutral-500">Sign in faster on this device</span>
                </span>
              </span>
              <input
                type="checkbox"
                class="h-5 w-5 accent-violet-600"
                [checked]="biometricEnabled()"
                (change)="toggleBiometric($event)"
              />
            </label>
          </div>
        </div>
      }

      <div>
        <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Account</h2>
        <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          @for (row of infoRows(); track row.label) {
            <div class="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 last:border-0 dark:border-neutral-800">
              <span class="flex items-center gap-3">
                <z-icon [zType]="row.icon" zSize="sm" class="text-neutral-400"></z-icon>
                <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ row.label }}</span>
              </span>
              <span class="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate max-w-[60%]">
                {{ row.value }}
              </span>
            </div>
          }
        </div>
      </div>

      <button
        type="button"
        (click)="logout()"
        class="w-full rounded-2xl bg-rose-50 px-4 py-3.5 text-sm font-semibold text-rose-600 dark:bg-rose-950/30 dark:text-rose-300 active:scale-98 transition"
      >
        Sign out
      </button>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private biometric = inject(BiometricService);
  private push = inject(PushService);
  protected native = inject(NativeService);

  readonly user = this.auth.currentUserSignal;

  readonly biometricAvailable = signal(false);
  readonly biometricEnabled = signal(false);
  readonly avatarFailed = signal(false);

  readonly infoRows = () => {
    const u = this.user();
    const items: { label: string; value: string; icon: ZardIcon }[] = [
      { label: 'Email', value: u?.email || '—', icon: 'send' },
      { label: 'Platform', value: this.native.platform, icon: 'smartphone' },
    ];
    if (u?.employee?.position) items.push({ label: 'Position', value: u.employee.position, icon: 'building' });
    return items;
  };

  async ngOnInit(): Promise<void> {
    if (!this.native.isNative) return;
    const [available, enabled] = await Promise.all([
      this.biometric.isAvailable(),
      this.biometric.isEnabled(),
    ]);
    this.biometricAvailable.set(available);
    this.biometricEnabled.set(enabled);
  }

  async toggleBiometric(e: Event): Promise<void> {
    this.native.hapticLight();
    const checked = (e.target as HTMLInputElement).checked;

    if (!checked) {
      await this.biometric.disable();
      this.biometricEnabled.set(false);
      return;
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const email = this.user()?.email;
    if (!refreshToken || !email) {
      (e.target as HTMLInputElement).checked = false;
      return;
    }

    const ok = await this.biometric.enrollWithToken(refreshToken, email);
    this.biometricEnabled.set(ok);
    if (!ok) (e.target as HTMLInputElement).checked = false;
  }

  initials(): string {
    const u = this.user();
    const name = u?.employee?.full_name || u?.email || '';
    return name
      .split(/\s+|@/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  }

  async logout(): Promise<void> {
    this.native.hapticMedium();
    // Unregister device token while we still have an auth session
    await this.push.unregister();
    await this.biometric.disable();
    // Clear tokens immediately to prevent interceptor refresh loop
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    void this.router.navigateByUrl('/m/login', { replaceUrl: true });
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/m/login', { replaceUrl: true }),
      error: () => this.router.navigateByUrl('/m/login', { replaceUrl: true }),
    });
  }
}
