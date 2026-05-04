export type ProjectStatus = 'Planning' | 'Active' | 'On_Hold' | 'Completed' | 'Cancelled';

export interface Project {
  id: number;
  public_id: string;
  company_id: number;
  code: string;
  name: string;
  description?: string | null;
  client_name?: string | null;
  status: ProjectStatus;
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | string | null;
  currency: string;
  po_number?: string | null;
  po_date?: string | null;
  po_value?: number | string | null;
  po_currency?: string | null;
  po_duration_months?: number | null;
  po_document_url?: string | null;
  manager_id?: number | null;
  notes?: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  manager?: { id: number; email: string };
  creator?: { id: number; email: string };
  financials?: ProjectFinancials;
}

export interface ProjectFinancials {
  total_invoiced: number;
  total_received: number;
  total_receivable: number;
  total_billed: number;
  total_paid: number;
  total_payable: number;
  realized_profit: number;
  unrealized_profit: number;
}

export interface ProjectListResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ProjectFilters {
  page?: number;
  limit?: number;
  status?: ProjectStatus | string;
  search?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface ProjectTransactions {
  invoices: any[];
  bills: any[];
  claims: any[];
}
