export interface AuditLog {
  id: number;
  user_id: number | null;
  company_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    id: number;
    email: string;
    full_name?: string;
    employee?: {
      full_name: string;
    };
  };
}

export interface AuditLogFilters {
  action?: string;
  entity_type?: string;
  user_id?: number;
  company_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
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
