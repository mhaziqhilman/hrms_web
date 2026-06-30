export type CashFlowSection = 'inflow' | 'outflow';
export type CashFlowSource = 'manual' | 'invoice' | 'bill' | 'payroll' | 'claim';
export type CashFlowStatus = 'Draft' | 'Final';

export interface CashFlowMonth {
  index: number;
  year: number;
  month: number;     // 1-12
  label: string;     // e.g. "May-24"
}

export interface CashFlowLine {
  id?: number;
  public_id?: string;
  section: CashFlowSection;
  label: string;
  sort_order: number;
  source: CashFlowSource;
  source_ref?: string | null;
  amounts: number[];          // projected, length = num_months
  actuals?: number[] | null;  // pulled from real data, or null
  total?: number;             // computed row total (read-only from API)
}

export interface CashFlowTotals {
  inflows: { by_month: number[]; total: number };
  outflows: { by_month: number[]; total: number };
  net: { by_month: number[]; total: number };
  opening: { by_month: number[] };
  closing: { by_month: number[]; final: number };
}

export interface CashFlowStatement {
  id: number;
  public_id: string;
  title: string;
  start_month: string;        // YYYY-MM-DD
  num_months: number;
  opening_balance: number;
  currency: string;
  status: CashFlowStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  creator?: { id: number; email: string } | null;
  months: CashFlowMonth[];
  inflow_lines: CashFlowLine[];
  outflow_lines: CashFlowLine[];
  totals: CashFlowTotals;
}

export interface CashFlowSummary {
  id: number;
  public_id: string;
  title: string;
  start_month: string;
  num_months: number;
  opening_balance: number;
  currency: string;
  status: CashFlowStatus;
  created_at: string;
  creator?: { id: number; email: string } | null;
  summary: {
    total_inflows: number;
    total_outflows: number;
    net: number;
    closing_balance: number;
  };
}

export interface CashFlowTemplate {
  inflow: { label: string; source: CashFlowSource }[];
  outflow: { label: string; source: CashFlowSource }[];
}

export interface CreateCashFlowPayload {
  title: string;
  start_month: string;
  num_months: number;
  opening_balance: number;
  currency?: string;
  status?: CashFlowStatus;
  notes?: string;
  seed_template?: boolean;
}
