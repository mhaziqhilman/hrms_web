export interface AnnouncementCategory {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  memo_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Memo {
  id: number;
  public_id?: string;
  title: string;
  content: string;
  summary?: string;
  author_id: number;
  company_id: number;
  category_id?: number;
  is_pinned: boolean;
  pinned_at?: string;
  status: 'Draft' | 'Published' | 'Archived';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  target_audience: 'All' | 'Department' | 'Position' | 'Specific';
  target_departments?: string[];
  target_positions?: string[];
  target_employee_ids?: number[];
  published_at?: string;
  expires_at?: string;
  requires_acknowledgment: boolean;
  attachment_count: number;
  view_count: number;
  acknowledgment_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: number;
    email: string;
    role: string;
    employee?: {
      full_name: string;
      position?: string;
      department?: string;
      photo_url?: string;
    };
  };
  category?: {
    id: number;
    name: string;
    slug: string;
    color?: string;
    icon?: string;
  };
  read_receipts?: MemoReadReceipt[];
}

export interface MemoReadReceipt {
  id: number;
  memo_id: number;
  employee_id: number;
  read_at: string;
  acknowledged_at?: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: number;
    employee_id: string;
    full_name: string;
  };
}

export interface MemoStatistics {
  memo_id: number;
  title: string;
  target_count: number;
  total_reads: number;
  total_acknowledgments: number;
  read_percentage: string;
  acknowledgment_percentage: string;
  requires_acknowledgment: boolean;
  read_receipts: MemoReadReceipt[];
}

export interface MemoFormData {
  title: string;
  content: string;
  summary?: string;
  status?: 'Draft' | 'Published' | 'Archived';
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  category_id?: number;
  is_pinned?: boolean;
  target_audience?: 'All' | 'Department' | 'Position' | 'Specific';
  target_departments?: string[];
  target_positions?: string[];
  target_employee_ids?: number[];
  published_at?: string;
  expires_at?: string;
  requires_acknowledgment?: boolean;
}

export interface MemoFilters {
  page?: number;
  limit?: number;
  status?: 'Draft' | 'Published' | 'Archived';
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  category_id?: number;
  target_audience?: 'All' | 'Department' | 'Position' | 'Specific';
  search?: string;
  author_id?: number;
  include_expired?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: 'newest' | 'oldest' | 'priority';
}
