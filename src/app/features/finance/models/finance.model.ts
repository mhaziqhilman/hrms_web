export type BillType = 'PO' | 'Bill' | 'Expense';
export type BillStatus = 'Draft' | 'Approved' | 'Received' | 'Partial_Paid' | 'Paid' | 'Cancelled';

export interface BillItem {
  id?: number;
  bill_id?: number;
  item_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount?: number;
  line_subtotal?: number;
  line_total?: number;
}

export interface BillPayment {
  id: number;
  bill_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  recorder?: { id: number; email: string };
}

export interface Bill {
  id: number;
  public_id: string;
  company_id: number;
  project_id?: number | null;
  bill_number: string;
  vendor_invoice_number?: string;
  bill_type: BillType;
  bill_date: string;
  due_date?: string | null;
  vendor_name: string;
  vendor_tin?: string;
  vendor_address?: string;
  vendor_email?: string;
  category?: string;
  currency: string;
  subtotal: number;
  total_tax: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: BillStatus;
  approved_at?: string | null;
  paid_at?: string | null;
  notes?: string;
  created_at: string;
  items?: BillItem[];
  payments?: BillPayment[];
  project?: { id: number; public_id: string; code: string; name: string } | null;
  creator?: { id: number; email: string };
  approver?: { id: number; email: string };
}

export interface BillListResponse {
  bills: Bill[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface BillFilters {
  page?: number;
  limit?: number;
  status?: string;
  bill_type?: BillType | string;
  project_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface PnLSummary {
  period: { from: string | null; to: string | null };
  project_id: string | null;
  sales: { invoiced: number; received: number; receivable: number; count: number };
  expenses: {
    bills: { billed: number; paid: number; payable: number; count: number };
    claims: { approved: number; paid: number; count: number };
    payroll: { gross: number; net_paid: number; count: number };
  };
  realized: { revenue: number; expense: number; profit: number; margin: number };
  unrealized: { revenue: number; expense: number; profit: number };
}

export interface SalesByMonth {
  year: number;
  by_month: { month: number; invoiced: number; received: number; count: number }[];
}

export interface ExpensesByCategory {
  by_category: { category: string; billed: number; paid: number; count: number }[];
}

export interface ProjectPnl {
  project: { public_id: string; code: string; name: string; status: string; budget: number | null };
  revenue: number;
  expense: number;
  realized_profit: number;
  receivable: number;
  payable: number;
  unrealized_profit: number;
}
