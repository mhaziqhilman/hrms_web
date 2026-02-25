import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '@/core/config/api.config';

interface AccountInfoResponse {
  success: boolean;
  data: {
    employee_name: string;
    email: string;
    photo_url: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;

  /** Signed URL for the profile picture (null = no picture) */
  readonly profilePictureUrl = signal<string | null>(null);

  /** User display name for initials fallback */
  readonly displayName = signal<string>('');

  /** Computed initials from display name */
  getInitials(): string {
    const name = this.displayName();
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }

  /** Fetch profile picture from account info endpoint */
  loadProfile(): void {
    this.http.get<AccountInfoResponse>(`${this.apiUrl}/settings/account`).subscribe({
      next: (res) => {
        if (res.success) {
          this.profilePictureUrl.set(this.validUrl(res.data.photo_url));
          this.displayName.set(res.data.employee_name || res.data.email || '');
        }
      }
    });
  }

  /** Update after upload */
  setProfilePicture(url: string): void {
    this.profilePictureUrl.set(this.validUrl(url));
  }

  /** Only accept absolute URLs — reject raw storage paths */
  private validUrl(url: string | null): string | null {
    return url?.startsWith('http') ? url : null;
  }

  /** Clear after removal */
  clearProfilePicture(): void {
    this.profilePictureUrl.set(null);
  }
}
