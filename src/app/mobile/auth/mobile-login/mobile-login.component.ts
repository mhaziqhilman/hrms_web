import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { AuthService } from '@/core/services/auth.service';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/core/config/api.config';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import type { ZardIcon } from '@/shared/components/icon/icons';
import { BiometricService, BiometryKind } from '@/mobile/services/biometric.service';
import { NativeService } from '@/mobile/services/native.service';
import { PushService } from '@/mobile/services/push.service';

@Component({
  selector: 'app-mobile-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ZardIconComponent],
  templateUrl: './mobile-login.component.html',
  styleUrls: ['./mobile-login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileLoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  protected native = inject(NativeService);
  protected biometric = inject(BiometricService);
  private push = inject(PushService);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly loading = signal(false);
  readonly unlocking = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly biometricAvailable = signal(false);
  readonly biometricEnabled = signal(false);
  readonly biometricKind = signal<BiometryKind>('generic');
  readonly storedEmail = signal<string | null>(null);

  readonly biometricLabel = computed(() => {
    switch (this.biometricKind()) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Fingerprint';
      case 'iris':
        return 'Iris';
      default:
        return 'Biometric';
    }
  });

  readonly biometricIcon = computed<ZardIcon>(() => 'shield');

  async ngOnInit(): Promise<void> {
    if (!this.native.isNative) return;

    const [available, enabled, kind, email] = await Promise.all([
      this.biometric.isAvailable(),
      this.biometric.isEnabled(),
      this.biometric.getBiometryKind(),
      this.biometric.getStoredEmail(),
    ]);

    this.biometricAvailable.set(available);
    this.biometricEnabled.set(enabled);
    this.biometricKind.set(kind);
    this.storedEmail.set(email);

    if (available && enabled && email) {
      queueMicrotask(() => void this.unlockWithBiometric());
    }
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.native.hapticLight();

    const { email, password } = this.form.value;

    this.auth.login({ email: email!, password: password! }).subscribe({
      next: async (response) => {
        this.loading.set(false);
        const refreshToken = (response.data as { refreshToken?: string })?.refreshToken;

        if (this.native.isNative && this.biometricAvailable() && !this.biometricEnabled() && refreshToken) {
          await this.offerBiometricEnrollment(refreshToken, email!);
        }

        // Register for push notifications (non-blocking)
        if (this.native.isNative) {
          void this.push.register();
        }

        this.navigateHome();
      },
      error: (err) => {
        this.loading.set(false);
        this.native.hapticMedium();
        this.error.set(err?.message || 'Login failed. Please check your credentials.');
      },
    });
  }

  async unlockWithBiometric(): Promise<void> {
    if (this.unlocking()) return;
    this.unlocking.set(true);
    this.error.set(null);

    const storedToken = await this.biometric.unlockAndGetToken(`Unlock Nextura HRMS`);
    if (!storedToken) {
      this.unlocking.set(false);
      return;
    }

    localStorage.setItem(REFRESH_TOKEN_KEY, storedToken);

    this.auth.refreshTokenRequest().subscribe({
      next: () => {
        this.auth.getCurrentUser().subscribe({
          next: () => {
            this.unlocking.set(false);
            if (this.native.isNative) {
              void this.push.register();
            }
            this.navigateHome();
          },
          error: () => {
            this.unlocking.set(false);
            this.error.set('Session refresh failed. Please sign in.');
          },
        });
      },
      error: () => {
        this.unlocking.set(false);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        this.error.set('Saved session expired. Please sign in again.');
      },
    });
  }

  private async offerBiometricEnrollment(refreshToken: string, email: string): Promise<void> {
    const confirmed = window.confirm(
      `Enable ${this.biometricLabel()} for quick sign-in next time?`,
    );
    if (!confirmed) return;
    const ok = await this.biometric.enrollWithToken(refreshToken, email);
    if (ok) this.biometricEnabled.set(true);
  }

  private navigateHome(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const target = returnUrl && !returnUrl.startsWith('/auth') ? returnUrl : '/m/home';
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }
}
