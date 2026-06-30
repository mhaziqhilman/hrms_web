/**
 * Subscription / package tier models (frontend mirror of the backend schema).
 */

export type PackageSlug = 'basic' | 'professional' | 'enterprise';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export type BillingCycle = 'monthly' | 'yearly' | 'none';

/** Feature flags are a free-form map of featureKey -> boolean. */
export type FeatureMap = Record<string, boolean>;

export interface PackageLimits {
  max_companies: number; // -1 = unlimited
  max_employees_per_company: number; // -1 = unlimited
  [key: string]: number;
}

export interface Package {
  id: number;
  public_id: string;
  name: string;
  slug: PackageSlug;
  tier: number;
  description?: string;
  price_monthly: number | string;
  price_yearly: number | string;
  currency: string;
  features: FeatureMap;
  limits: PackageLimits;
  trial_days: number;
  is_active: boolean;
  is_available: boolean; // false => "Coming Soon"
  sort_order: number;
}

export interface Subscription {
  id: number;
  public_id: string;
  user_id: number;
  package_id: number;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  started_at?: string;
  current_period_start?: string;
  current_period_end?: string | null;
  trial_ends_at?: string | null;
  cancel_at?: string | null;
  canceled_at?: string | null;
  package?: Package;
}

export interface UsageMetric {
  current: number;
  limit: number; // -1 = unlimited
}

export interface UsageSnapshot {
  limits?: PackageLimits;
  usage: {
    max_companies: UsageMetric;
    max_employees_per_company: UsageMetric;
    [key: string]: UsageMetric;
  };
}

export interface SubscriptionHistoryEntry {
  id: number;
  public_id: string;
  user_id: number;
  action: string;
  reason?: string;
  created_at: string;
  from_package?: Pick<Package, 'id' | 'name' | 'slug' | 'tier'>;
  to_package?: Pick<Package, 'id' | 'name' | 'slug' | 'tier'>;
}

export interface MeSubscriptionResponse {
  subscription: Subscription;
  usage: UsageSnapshot['usage'];
}

/** Admin: a subscription row joined with its user. */
export interface AdminSubscriptionRow extends Subscription {
  user?: {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    company_id: number | null;
  };
}
