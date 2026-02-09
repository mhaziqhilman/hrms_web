import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '@/core/config/api.config';
import {
  SettingsResponse,
  AccountInfoResponse,
  UpdateSettingsResponse,
  ChangePasswordResponse,
  AppearanceSettings,
  DisplaySettings,
  NotificationSettings,
  ChangePasswordRequest
} from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  getSettings(): Observable<SettingsResponse> {
    return this.http.get<SettingsResponse>(`${this.apiUrl}/settings`);
  }

  getAccountInfo(): Observable<AccountInfoResponse> {
    return this.http.get<AccountInfoResponse>(`${this.apiUrl}/settings/account`);
  }

  updateAppearance(data: AppearanceSettings): Observable<UpdateSettingsResponse> {
    return this.http.put<UpdateSettingsResponse>(`${this.apiUrl}/settings/appearance`, data);
  }

  updateDisplay(data: DisplaySettings): Observable<UpdateSettingsResponse> {
    return this.http.put<UpdateSettingsResponse>(`${this.apiUrl}/settings/display`, data);
  }

  updateNotifications(data: NotificationSettings): Observable<UpdateSettingsResponse> {
    return this.http.put<UpdateSettingsResponse>(`${this.apiUrl}/settings/notifications`, data);
  }

  changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(`${this.apiUrl}/settings/change-password`, data);
  }

  resetToDefault(): Observable<UpdateSettingsResponse> {
    return this.http.post<UpdateSettingsResponse>(`${this.apiUrl}/settings/reset`, {});
  }
}
