import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { API_CONFIG, TOKEN_KEY } from '../config/api.config';
import {
  Package,
  Subscription,
  UsageSnapshot,
  SubscriptionHistoryEntry,
  FeatureMap,
  PackageLimits,
  MeSubscriptionResponse
} from '../models/subscription.models';
import { AuthService } from './auth.service';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * SubscriptionService — singleton holding the current user's plan + usage as
 * signals. During the Basic-open phase, Basic grants every feature so
 * hasFeature() returns true for everything; the plumbing is ready for when
 * real tiers launch.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = API_CONFIG.apiUrl;

  currentSubscription = signal<Subscription | null>(null);
  usage = signal<UsageSnapshot['usage'] | null>(null);
  packages = signal<Package[]>([]);
  loading = signal(false);

  currentPackage = computed<Package | null>(() => this.currentSubscription()?.package ?? null);
  features = computed<FeatureMap>(() => this.currentPackage()?.features ?? {});
  limits = computed<PackageLimits | null>(() => this.currentPackage()?.limits ?? null);
  planName = computed<string>(() => this.currentPackage()?.name ?? 'Basic');
  planSlug = computed<string>(() => this.currentPackage()?.slug ?? 'basic');

  constructor() {
    // Load once on startup if the user is already authenticated.
    if (localStorage.getItem(TOKEN_KEY)) {
      this.loadSubscription().subscribe({ error: () => {} });
    }
  }

  /** Super admins bypass all gating (mirrors backend). */
  private isSuperAdmin(): boolean {
    return this.auth.getCurrentUserValue()?.role === 'super_admin';
  }

  /** True when the current plan unlocks the given feature. */
  hasFeature(key: string): boolean {
    if (this.isSuperAdmin()) return true;
    return this.features()[key] === true;
  }

  /** True when usage for the given limit key is still under the cap. */
  isWithinLimit(key: string): boolean {
    if (this.isSuperAdmin()) return true;
    const metric = this.usage()?.[key];
    if (!metric) return true;
    if (metric.limit === -1) return true;
    return metric.current < metric.limit;
  }

  /** Load current subscription + usage and update signals. */
  loadSubscription(): Observable<MeSubscriptionResponse> {
    this.loading.set(true);
    return this.http
      .get<ApiResponse<MeSubscriptionResponse>>(`${this.apiUrl}${API_CONFIG.endpoints.subscription.me}`)
      .pipe(
        map(res => res.data),
        tap(data => {
          if (data) {
            this.currentSubscription.set(data.subscription);
            this.usage.set(data.usage);
          }
          this.loading.set(false);
        })
      );
  }

  /** Refresh just the usage snapshot. */
  loadUsage(): Observable<UsageSnapshot> {
    return this.http
      .get<ApiResponse<UsageSnapshot>>(`${this.apiUrl}${API_CONFIG.endpoints.subscription.usage}`)
      .pipe(
        map(res => res.data),
        tap(data => data && this.usage.set(data.usage))
      );
  }

  /** Public package catalog (pricing / upgrade page). */
  loadPackages(): Observable<Package[]> {
    return this.http
      .get<ApiResponse<Package[]>>(`${this.apiUrl}${API_CONFIG.endpoints.packages.base}`)
      .pipe(
        map(res => res.data ?? []),
        tap(pkgs => this.packages.set(pkgs))
      );
  }

  /** Own subscription history. */
  loadHistory(): Observable<SubscriptionHistoryEntry[]> {
    return this.http
      .get<ApiResponse<SubscriptionHistoryEntry[]>>(`${this.apiUrl}${API_CONFIG.endpoints.subscription.history}`)
      .pipe(map(res => res.data ?? []));
  }

  /** Change plan (self-service). Re-fetches subscription on success. */
  changePlan(slug: string, billingCycle: string = 'none'): Observable<Subscription> {
    return this.http
      .post<ApiResponse<Subscription>>(`${this.apiUrl}${API_CONFIG.endpoints.subscription.change}`, {
        slug,
        billingCycle
      })
      .pipe(
        map(res => res.data),
        tap(() => this.loadSubscription().subscribe({ error: () => {} }))
      );
  }

  /** Cancel subscription (drops to Basic). Re-fetches on success. */
  cancel(): Observable<Subscription> {
    return this.http
      .post<ApiResponse<Subscription>>(`${this.apiUrl}${API_CONFIG.endpoints.subscription.cancel}`, {})
      .pipe(
        map(res => res.data),
        tap(() => this.loadSubscription().subscribe({ error: () => {} }))
      );
  }

  /** Clear cached state (call on logout / company switch before reload). */
  reset(): void {
    this.currentSubscription.set(null);
    this.usage.set(null);
  }
}
