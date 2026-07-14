export interface Invoice {
  id: number;
  public_id: string;
  company_id: number;
  invoice_number: string;
  title: string | null;
  invoice_date: string;
  due_date: string | null;
  commence_date_start: string | null;
  commence_date_end: string | null;
  invoice_type: '01' | '02' | '03' | '04';
  is_self_billed: boolean;
  currency: string;
  exchange_rate: number;
  payment_terms: string | null;

  // Supplier
  supplier_name: string;
  supplier_tin: string | null;
  supplier_brn: string | null;
  supplier_sst_no: string | null;
  supplier_address: string | null;
  supplier_phone: string | null;
  supplier_email: string | null;
  supplier_msic_code: string | null;

  // Buyer
  buyer_name: string;
  buyer_tin: string | null;
  buyer_brn: string | null;
  buyer_address: string | null;
  buyer_phone: string | null;
  buyer_email: string | null;

  // Totals
  subtotal: number;
  total_discount: number;
  total_tax: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;

  // LHDN
  lhdn_uuid: string | null;
  lhdn_long_id: string | null;
  lhdn_submission_uid: string | null;
  lhdn_status: string | null;
  lhdn_submitted_at: string | null;
  lhdn_validated_at: string | null;
  lhdn_qr_url: string | null;
  lhdn_validation_errors: LhdnValidationError[] | null;

  // Workflow
  status: InvoiceStatus;
  approved_by: number | null;
  approved_at: string | null;
  cancelled_by: number | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;

  // Source
  source_type: 'manual' | 'payroll' | 'claim' | null;
  source_id: number | null;
  project_id: number | null;
  project?: { id: number; public_id: string; code: string; name: string; client_name: string | null; po_number: string | null };

  // Audit
  notes: string | null;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;

  // Includes
  creator?: { id: number; email: string };
  approver?: { id: number; email: string };
  canceller?: { id: number; email: string };
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  item_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_rate: number;
  tax_type: TaxType;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  total: number;
  classification_code: string | null;
  unit_of_measurement: string;
  po_number?: string | null;
  project_id?: number | null;
  project?: { id: number; public_id: string; code: string; name: string } | null;
}

export interface InvoicePayment {
  id: number;
  invoice_id: number;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
  recorder?: { id: number; email: string };
}

export interface LhdnValidationError {
  code?: string;
  message: string;
  target?: string;
  name?: string;
}

export interface InvoiceAnalytics {
  statusCounts: Record<string, number>;
  totals: {
    total_invoiced: number;
    total_paid: number;
    total_outstanding: number;
  };
  monthlyTotals: { year: number; month: number; count: number; total: number }[];
  aging: {
    current: number;
    days_31_60: number;
    days_61_90: number;
    days_over_90: number;
  };
}

export interface InvoiceListFilters {
  page?: number;
  limit?: number;
  status?: string;
  invoice_type?: string;
  is_self_billed?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export type ExtractionProvider = 'anthropic' | 'qwen';

export interface PoMatchProject {
  id: number;
  public_id: string;
  code: string;
  name: string;
  client_name: string | null;
  po_number: string | null;
  currency: string | null;
}

export interface PoMatchEntry {
  po_number: string;
  project: PoMatchProject | null;
  recipient_match: boolean;
}

export interface PoMatchResult {
  found: boolean;
  matches: PoMatchEntry[];
  multi_po?: boolean;
  single_project?: boolean;
  // Convenience fields populated only when a single project covers all POs:
  recipient_match?: boolean;
  project?: PoMatchProject;
  extracted_buyer_name?: string;
  project_client_name?: string | null;
  searched_pos?: string[];
}

export interface ExtractedInvoiceData {
  invoice_number?: string;
  po_number?: string;
  title?: string;
  invoice_date?: string;
  due_date?: string;
  commence_date_start?: string;
  commence_date_end?: string;
  invoice_type?: '01' | '02' | '03' | '04';
  currency?: string;
  payment_terms?: string;
  is_self_billed?: boolean;
  notes?: string;
  supplier_name?: string;
  supplier_tin?: string;
  supplier_brn?: string;
  supplier_sst_no?: string;
  supplier_msic_code?: string;
  supplier_address?: string;
  supplier_phone?: string;
  supplier_email?: string;
  buyer_name?: string;
  buyer_tin?: string;
  buyer_brn?: string;
  buyer_address?: string;
  buyer_phone?: string;
  buyer_email?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    tax_type: TaxType;
    tax_rate: number;
    unit_of_measurement?: string;
    classification_code?: string;
    po_number?: string;
  }>;
  confidence: 'high' | 'medium' | 'low';
  extraction_notes?: string[];
}

export interface ExtractFromPdfResponse {
  extracted: ExtractedInvoiceData;
  filename: string;
  provider: ExtractionProvider | string;
  po_match: PoMatchResult;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens: number;
    cache_creation_input_tokens: number;
    pages_rendered?: number;
  };
}

export interface BulkImportResult {
  created: Array<{
    filename: string;
    public_id: string;
    invoice_number: string;
    title: string | null;
    total_amount: number;
    confidence: 'high' | 'medium' | 'low';
    extraction_notes: string[];
  }>;
  failed: Array<{
    filename: string;
    error: string;
  }>;
}

export interface BulkExtractItem {
  filename: string;
  extracted?: ExtractedInvoiceData;
  po_match?: PoMatchResult;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens: number;
    cache_creation_input_tokens: number;
    pages_rendered?: number;
  };
  error?: string;
}

export interface BulkExtractResult {
  results: BulkExtractItem[];
}

export interface BulkCreateItem {
  filename: string;
  extracted: ExtractedInvoiceData;
  project_id?: number | null;
}

export interface TinValidationResult {
  isValid: boolean;
  tin: string;
  name: string | null;
  message: string;
}

export interface BulkSubmitResult {
  accepted: string[];
  rejected: { invoice_number: string; errors: LhdnValidationError[] }[];
  skipped: { invoice_number?: string; message?: string; error?: string }[];
}

export type InvoiceStatus = 'Draft' | 'Pending' | 'Submitted' | 'Valid' | 'Invalid' | 'Cancelled' | 'Superseded' | 'Recorded';
export type InvoiceType = '01' | '02' | '03' | '04';
export type TaxType = 'SST' | 'Service Tax' | 'Exempt' | 'Zero Rated';
export type PaymentMethod = 'Bank Transfer' | 'Cash' | 'Cheque' | 'Credit Card' | 'E-Wallet' | 'Other';

export const INVOICE_TYPE_LABELS: Record<string, string> = {
  '01': 'Invoice',
  '02': 'Credit Note',
  '03': 'Debit Note',
  '04': 'Refund Note'
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Submitted: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  Valid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  Invalid: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  Cancelled: 'bg-muted text-muted-foreground',
  Superseded: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  Recorded: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
};
