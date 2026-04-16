import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { NativeService } from './native.service';
import { API_CONFIG } from '@/core/config/api.config';

@Injectable({ providedIn: 'root' })
export class PushService {
  private native = inject(NativeService);
  private router = inject(Router);
  private http = inject(HttpClient);

  readonly token = signal<string | null>(null);
  readonly permission = signal<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  private listenersAttached = false;

  /**
   * Request permission, register with FCM/APNs, and POST the token to the backend.
   * Safe to call multiple times — listeners attach once.
   */
  async register(): Promise<string | null> {
    if (!this.native.isNative) return null;

    const perm = await PushNotifications.requestPermissions();
    this.permission.set(perm.receive as 'granted' | 'denied' | 'prompt');
    if (perm.receive !== 'granted') return null;

    this.attachListenersOnce();
    await PushNotifications.register();

    return new Promise<string | null>((resolve) => {
      let resolved = false;
      const resolveOnce = (v: string | null) => {
        if (!resolved) {
          resolved = true;
          resolve(v);
        }
      };
      const onReg = PushNotifications.addListener('registration', async (t: Token) => {
        this.token.set(t.value);
        await this.sendTokenToBackend(t.value);
        resolveOnce(t.value);
        void onReg.then((h) => h.remove());
      });
      const onErr = PushNotifications.addListener('registrationError', () => {
        resolveOnce(null);
        void onErr.then((h) => h.remove());
      });
      setTimeout(() => resolveOnce(null), 15000);
    });
  }

  /**
   * Unregister the current device's token from the backend.
   * Call this before clearing the auth session on logout.
   */
  async unregister(): Promise<void> {
    const token = this.token();
    if (!token) return;
    try {
      await firstValueFrom(
        this.http.request('DELETE', `${API_CONFIG.apiUrl}${API_CONFIG.endpoints.notifications.deviceToken}`, {
          body: { token },
        })
      );
    } catch {
      // best-effort; ignore network/auth failures on logout
    } finally {
      this.token.set(null);
    }
  }

  async clear(): Promise<void> {
    if (!this.native.isNative) return;
    await PushNotifications.removeAllDeliveredNotifications();
  }

  private attachListenersOnce(): void {
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    PushNotifications.addListener('pushNotificationReceived', (_n: PushNotificationSchema) => {
      // foreground receive — UI can react via notification polling / refresh
    });
    PushNotifications.addListener('pushNotificationActionPerformed', (a: ActionPerformed) => {
      const link = (a.notification.data?.['link'] as string) || '/m';
      void this.router.navigateByUrl(link);
    });
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      const info = await Device.getInfo();
      const deviceId = await Device.getId();
      let appVersion = '';
      try {
        const appInfo = await App.getInfo();
        appVersion = appInfo.version;
      } catch {
        // @capacitor/app getInfo isn't available on web
      }
      await firstValueFrom(
        this.http.post(`${API_CONFIG.apiUrl}${API_CONFIG.endpoints.notifications.deviceToken}`, {
          token,
          platform: this.native.platform,
          device_id: deviceId.identifier,
          device_model: `${info.manufacturer ?? ''} ${info.model ?? ''}`.trim(),
          app_version: appVersion,
        })
      );
    } catch {
      // non-fatal — token will be retried on next login
    }
  }
}
