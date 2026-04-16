import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Device, DeviceInfo } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

@Injectable({ providedIn: 'root' })
export class NativeService {
  readonly isNative = Capacitor.isNativePlatform();
  readonly platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

  readonly online = signal<boolean>(true);
  readonly deviceInfo = signal<DeviceInfo | null>(null);

  async initialize(): Promise<void> {
    if (!this.isNative) return;

    await this.setupStatusBar();
    await this.loadDeviceInfo();
    await this.watchNetwork();
    await SplashScreen.hide({ fadeOutDuration: 300 });
  }

  private async setupStatusBar(): Promise<void> {
    try {
      await StatusBar.setStyle({ style: Style.Light });
      if (this.platform === 'android') {
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
      }
    } catch { /* status bar not supported */ }
  }

  private async loadDeviceInfo(): Promise<void> {
    const info = await Device.getInfo();
    this.deviceInfo.set(info);
  }

  private async watchNetwork(): Promise<void> {
    const status = await Network.getStatus();
    this.online.set(status.connected);
    Network.addListener('networkStatusChange', (s: ConnectionStatus) => {
      this.online.set(s.connected);
    });
  }

  async exitApp(): Promise<void> {
    if (this.isNative) await App.exitApp();
  }

  hapticLight(): void {
    if (this.isNative) void Haptics.impact({ style: ImpactStyle.Light });
  }

  hapticMedium(): void {
    if (this.isNative) void Haptics.impact({ style: ImpactStyle.Medium });
  }

  async setPref(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  async getPref(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  }

  async removePref(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  async saveAndShareFile(blob: Blob, fileName: string, mimeType: string): Promise<void> {
    if (!this.isNative) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    const base64 = await this.blobToBase64(blob);
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });

    await Share.share({
      title: fileName,
      url: uri,
      dialogTitle: 'Save or share file',
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const idx = result.indexOf(',');
        resolve(idx >= 0 ? result.slice(idx + 1) : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}
