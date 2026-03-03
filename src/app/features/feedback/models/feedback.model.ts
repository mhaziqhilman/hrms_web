export type FeedbackCategory = 'bug' | 'feature_request' | 'ui_ux' | 'performance' | 'general';
export type FeedbackStatus = 'new' | 'in_review' | 'resolved' | 'closed';

export interface Feedback {
  id: number;
  user_id: number;
  company_id: number | null;
  category: FeedbackCategory;
  rating: number;
  description: string;
  screenshot_url: string | null;
  screenshot_signed_url?: string;
  page_url: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    email: string;
    employee?: {
      full_name: string;
    };
  };
}

export interface FeedbackStats {
  by_status: { status: FeedbackStatus; count: number }[];
  by_category: { category: FeedbackCategory; count: number }[];
  average_rating: number;
  total: number;
}

export interface FeedbackFilters {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  rating?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface SubmitFeedbackRequest {
  category: FeedbackCategory;
  rating: number;
  description: string;
  page_url?: string;
  screenshot?: File;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  };
}
