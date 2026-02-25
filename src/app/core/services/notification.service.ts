import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_CONFIG } from '@/core/config/api.config';
import { Notification, NotificationFilters, NotificationPagination } from '@/core/models/notification.models';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: NotificationPagination;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private http = inject(HttpClient);
  private apiUrl = API_CONFIG.apiUrl;
  private pollingInterval: any = null;

  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);
  loading = signal<boolean>(false);
  pagination = signal<NotificationPagination | null>(null);

  constructor() {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private startPolling(): void {
    this.fetchUnreadCount();
    this.pollingInterval = setInterval(() => {
      this.fetchUnreadCount();
    }, 60000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  fetchUnreadCount(): void {
    this.http.get<ApiResponse<{ count: number }>>(
      `${this.apiUrl}${API_CONFIG.endpoints.notifications.unreadCount}`
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.unreadCount.set(res.data.count);
        }
      }
    });
  }

  loadNotifications(filters: NotificationFilters = {}): void {
    this.loading.set(true);
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.is_read !== undefined && filters.is_read !== '') {
      params = params.set('is_read', filters.is_read.toString());
    }
    if (filters.type) params = params.set('type', filters.type);
    if (filters.search) params = params.set('search', filters.search);

    this.http.get<ApiResponse<Notification[]>>(
      `${this.apiUrl}${API_CONFIG.endpoints.notifications.base}`,
      { params }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.set(res.data);
          if (res.pagination) {
            this.pagination.set(res.pagination);
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadRecentNotifications(): void {
    this.http.get<ApiResponse<Notification[]>>(
      `${this.apiUrl}${API_CONFIG.endpoints.notifications.base}`,
      { params: new HttpParams().set('limit', '5') }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.set(res.data);
        }
      }
    });
  }

  markAsRead(id: number): void {
    this.http.patch<ApiResponse<Notification>>(
      `${this.apiUrl}${API_CONFIG.endpoints.notifications.markAsRead(id)}`,
      {}
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.update(list =>
            list.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
          );
          this.unreadCount.update(c => Math.max(0, c - 1));
        }
      }
    });
  }

  markAllAsRead(): void {
    this.http.patch<ApiResponse<void>>(
      `${this.apiUrl}${API_CONFIG.endpoints.notifications.markAllRead}`,
      {}
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.update(list =>
            list.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
          );
          this.unreadCount.set(0);
        }
      }
    });
  }

  deleteNotification(id: number): void {
    this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}${API_CONFIG.endpoints.notifications.detail(id)}`
    ).subscribe({
      next: (res) => {
        if (res.success) {
          const removed = this.notifications().find(n => n.id === id);
          this.notifications.update(list => list.filter(n => n.id !== id));
          if (removed && !removed.is_read) {
            this.unreadCount.update(c => Math.max(0, c - 1));
          }
        }
      }
    });
  }
}
