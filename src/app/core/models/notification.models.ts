export type NotificationType =
  | 'leave_approved'
  | 'leave_rejected'
  | 'claim_approved'
  | 'claim_rejected'
  | 'claim_finance_approved'
  | 'claim_finance_rejected'
  | 'wfh_approved'
  | 'wfh_rejected'
  | 'announcement_published'
  | 'team_member_joined'
  | 'policy_published';

export interface Notification {
  id: number;
  user_id: number;
  company_id: number;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  is_read?: boolean | '';
  type?: NotificationType | '';
  search?: string;
  page?: number;
  limit?: number;
}

export interface NotificationPagination {
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
}
