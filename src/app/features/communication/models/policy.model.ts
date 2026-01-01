export interface Policy {
  id: number;
  policy_code: string;
  title: string;
  description?: string;
  content: string;
  category: 'HR' | 'IT' | 'Finance' | 'Safety' | 'Compliance' | 'Operations' | 'Other';
  version: string;
  status: 'Draft' | 'Active' | 'Archived' | 'Superseded';
  author_id: number;
  approved_by?: number;
  approved_at?: string;
  effective_from?: string;
  review_date?: string;
  expires_at?: string;
  parent_policy_id?: number;
  requires_acknowledgment: boolean;
  file_url?: string;
  file_size?: number;
  view_count: number;
  acknowledgment_count: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  author?: {
    id: number;
    email: string;
    full_name: string;
  };
  approver?: {
    id: number;
    email: string;
    full_name: string;
  };
  parent?: {
    id: number;
    policy_code: string;
    title: string;
    version: string;
  };
  versions?: Policy[];
  acknowledgments?: PolicyAcknowledgment[];
}

export interface PolicyAcknowledgment {
  id: number;
  policy_id: number;
  employee_id: number;
  viewed_at: string;
  acknowledged_at?: string;
  policy_version: string;
  ip_address?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: number;
    employee_id: string;
    full_name: string;
  };
}

export interface PolicyStatistics {
  policy_id: number;
  policy_code: string;
  title: string;
  version: string;
  total_employees: number;
  total_views: number;
  total_acknowledgments: number;
  view_percentage: string;
  acknowledgment_percentage: string;
  requires_acknowledgment: boolean;
  acknowledgments: PolicyAcknowledgment[];
}

export interface PolicyFormData {
  policy_code: string;
  title: string;
  description?: string;
  content: string;
  category?: 'HR' | 'IT' | 'Finance' | 'Safety' | 'Compliance' | 'Operations' | 'Other';
  version?: string;
  status?: 'Draft' | 'Active' | 'Archived' | 'Superseded';
  effective_from?: string;
  review_date?: string;
  expires_at?: string;
  requires_acknowledgment?: boolean;
  file_url?: string;
  file_size?: number;
  tags?: string[];
  parent_policy_id?: number;
}

export interface PolicyFilters {
  page?: number;
  limit?: number;
  status?: 'Draft' | 'Active' | 'Archived' | 'Superseded';
  category?: 'HR' | 'IT' | 'Finance' | 'Safety' | 'Compliance' | 'Operations' | 'Other';
  search?: string;
  author_id?: number;
  include_expired?: boolean;
}

export interface PolicyCategory {
  category: string;
  count: number;
}
