export interface LeaveTypeConfig {
  id: number;
  company_id: number;
  name: string;
  days_per_year: number;
  is_paid: boolean;
  carry_forward_allowed: boolean;
  carry_forward_max_days: number;
  prorate_for_new_joiners: boolean;
  requires_document: boolean;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClaimTypeConfig {
  id: number;
  name: string;
  description?: string;
  requires_receipt: boolean;
  max_amount?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PublicHoliday {
  id: number;
  company_id: number;
  name: string;
  date: string;
  description?: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface StatutoryConfigItem {
  id: number;
  company_id: number;
  config_key: string;
  config_value: string;
  description?: string;
  effective_from?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateItem {
  id: number;
  company_id: number;
  template_key: string;
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailPreview {
  subject: string;
  body: string;
}

export interface CompanyProfile {
  id: number;
  name: string;
  registration_no?: string;
  description?: string;
  industry?: string;
  size?: string;
  country: string;
  address?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  owner_id: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
