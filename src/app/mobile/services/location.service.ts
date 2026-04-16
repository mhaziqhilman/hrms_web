import { Injectable, inject } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { NativeService } from './native.service';

export interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private native = inject(NativeService);

  async requestPermission(): Promise<boolean> {
    if (!this.native.isNative) return true;
    try {
      const status = await Geolocation.requestPermissions({ permissions: ['location'] });
      return status.location === 'granted';
    } catch {
      return false;
    }
  }

  async getCurrent(): Promise<Coords | null> {
    try {
      const pos: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10_000,
      });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
    } catch {
      return null;
    }
  }
}
