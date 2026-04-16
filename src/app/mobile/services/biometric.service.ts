import { Injectable, inject } from '@angular/core';
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { NativeService } from './native.service';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const VAULT_REFRESH_TOKEN_KEY = 'vault_refresh_token';
const VAULT_USER_EMAIL_KEY = 'vault_user_email';

export type BiometryKind = 'face' | 'fingerprint' | 'iris' | 'generic';

@Injectable({ providedIn: 'root' })
export class BiometricService {
  private native = inject(NativeService);

  async isAvailable(): Promise<boolean> {
    if (!this.native.isNative) return false;
    try {
      const info = await BiometricAuth.checkBiometry();
      return info.isAvailable && info.biometryType !== BiometryType.none;
    } catch {
      return false;
    }
  }

  async getBiometryKind(): Promise<BiometryKind> {
    if (!this.native.isNative) return 'generic';
    try {
      const info = await BiometricAuth.checkBiometry();
      switch (info.biometryType) {
        case BiometryType.faceId:
        case BiometryType.faceAuthentication:
          return 'face';
        case BiometryType.touchId:
        case BiometryType.fingerprintAuthentication:
          return 'fingerprint';
        case BiometryType.irisAuthentication:
          return 'iris';
        default:
          return 'generic';
      }
    } catch {
      return 'generic';
    }
  }

  async isEnabled(): Promise<boolean> {
    const v = await this.native.getPref(BIOMETRIC_ENABLED_KEY);
    return v === 'true';
  }

  async authenticate(reason = 'Unlock Nextura HRMS'): Promise<boolean> {
    if (!this.native.isNative) return true;
    try {
      await BiometricAuth.authenticate({
        reason,
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Use Passcode',
        androidTitle: 'Nextura HRMS',
        androidSubtitle: reason,
        androidConfirmationRequired: false,
      });
      return true;
    } catch {
      return false;
    }
  }

  async enrollWithToken(refreshToken: string, userEmail: string): Promise<boolean> {
    const ok = await this.authenticate('Confirm to enable biometric unlock');
    if (!ok) return false;
    await this.native.setPref(BIOMETRIC_ENABLED_KEY, 'true');
    await this.native.setPref(VAULT_REFRESH_TOKEN_KEY, refreshToken);
    await this.native.setPref(VAULT_USER_EMAIL_KEY, userEmail);
    return true;
  }

  async getStoredEmail(): Promise<string | null> {
    return this.native.getPref(VAULT_USER_EMAIL_KEY);
  }

  async unlockAndGetToken(reason = 'Unlock Nextura HRMS'): Promise<string | null> {
    const enabled = await this.isEnabled();
    if (!enabled) return null;
    const ok = await this.authenticate(reason);
    if (!ok) return null;
    return this.native.getPref(VAULT_REFRESH_TOKEN_KEY);
  }

  async disable(): Promise<void> {
    await this.native.setPref(BIOMETRIC_ENABLED_KEY, 'false');
    await this.native.removePref(VAULT_REFRESH_TOKEN_KEY);
    await this.native.removePref(VAULT_USER_EMAIL_KEY);
  }
}
