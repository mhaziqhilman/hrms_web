export interface Claim {
  id: number;
  employee_id: number;
  claim_type_id: number;
  date: string;
  amount: number | string;
  description: string;
  receipt_url?: string;
  status: 'Pending' | 'Manager_Approved' | 'Finance_Approved' | 'Rejected' | 'Paid';
  manager_approved_by?: number;
  manager_approved_at?: string;
  finance_approved_by?: number;
  finance_approved_at?: string;
  rejection_reason?: string;
  payment_date?: string;
  payment_method?: 'Bank Transfer' | 'Cash' | 'Cheque';
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  employee?: ClaimEmployee;
  claimType?: ClaimType;
  managerApprover?: ClaimUser;
  financeApprover?: ClaimUser;
}

export interface ClaimEmployee {
  id: number;
  full_name: string;
  employee_code: string;
  department?: string;
  position?: string;
}

export interface ClaimType {
  id: number;
  name: string;
  description?: string;
  requires_receipt?: boolean;
  max_amount?: number | string;
  is_active?: boolean;
}

export interface ClaimUser {
  id: number;
  email: string;
  role: string;
}

export interface ClaimSummary {
  employee_id: number;
  employee_name: string;
  period: string;
  total_claims: number;
  total_amount: number;
  pending_count: number;
  pending_amount: number;
  manager_approved_count: number;
  manager_approved_amount: number;
  finance_approved_count: number;
  finance_approved_amount: number;
  paid_count: number;
  paid_amount: number;
  rejected_count: number;
  rejected_amount: number;
  by_type: {
    [key: string]: {
      count: number;
      total_amount: number;
    };
  };
}

export interface SubmitClaimRequest {
  employee_id: number;
  claim_type_id: number;
  date: string;
  amount: number;
  description: string;
  receipt_url?: string;
}

export interface UpdateClaimRequest {
  claim_type_id?: number;
  date?: string;
  amount?: number;
  description?: string;
  receipt_url?: string;
}

export interface ManagerApprovalRequest {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface FinanceApprovalRequest {
  action: 'approve' | 'reject' | 'paid';
  rejection_reason?: string;
  payment_date?: string;
  payment_method?: 'Bank Transfer' | 'Cash' | 'Cheque';
  payment_reference?: string;
}

export interface ClaimQueryParams {
  page?: number;
  limit?: number;
  employee_id?: number;
  claim_type_id?: number;
  status?: 'Pending' | 'Manager_Approved' | 'Finance_Approved' | 'Rejected' | 'Paid';
  start_date?: string;
  end_date?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
