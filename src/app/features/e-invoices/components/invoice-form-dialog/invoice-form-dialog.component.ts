import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormControlComponent } from '@/shared/components/form/form-control.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';
import { ZardSegmentedComponent, SegmentedOption } from '@/shared/components/segmented/segmented.component';

import { EInvoiceService } from '../../services/e-invoice.service';
import { Invoice, TaxType, INVOICE_TYPE_LABELS } from '../../models/invoice.model';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_rate: number;
  tax_type: TaxType;
  tax_rate: number;
  classification_code: string;
  unit_of_measurement: string;
  subtotal: number;
  tax_amount: number;
  total: number;
}

interface StepConfig {
  number: number;
  label: string;
}

export interface InvoiceFormDialogData {
  invoice?: Invoice;
  onSuccess?: (invoice: any) => void;
}

@Component({
  selector: 'app-invoice-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardDividerComponent,
    ZardInputDirective,
    ZardFormLabelComponent,
    ZardFormFieldComponent,
    ZardFormControlComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardDatePickerComponent,
    ZardCheckboxComponent,
    ZardTooltipModule,
    ZardSegmentedComponent
  ],
  templateUrl: './invoice-form-dialog.component.html',
  styleUrls: ['./invoice-form-dialog.component.css']
})
export class InvoiceFormDialogComponent implements OnInit {
  private invoiceService = inject(EInvoiceService);
  private dialogRef = inject(ZardDialogRef);
  private dialogData = inject(Z_MODAL_DATA, { optional: true }) as InvoiceFormDialogData | null;
  private fb = inject(FormBuilder);

  // Mode
  isEditMode = false;
  private invoicePublicId: string | null = null;

  // ─── Create mode: Stepper ─────────────────────────────────
  currentStep = 1;
  readonly steps: StepConfig[] = [
    { number: 1, label: 'Invoice Details' },
    { number: 2, label: 'Parties' },
    { number: 3, label: 'Line Items' },
    { number: 4, label: 'Review' }
  ];

  // ─── Edit mode: Segmented tabs ────────────────────────────
  activeTab = 'details';
  readonly tabOptions: SegmentedOption[] = [
    { value: 'details', label: 'Invoice Details' },
    { value: 'parties', label: 'Parties' },
    { value: 'items', label: 'Line Items' },
    { value: 'review', label: 'Review' }
  ];

  // State
  loading = signal(false);
  saving = signal(false);
  supplierExpanded = true;
  buyerExpanded = true;

  // Step 1: Invoice Details Form
  detailsForm: FormGroup = this.fb.group({
    invoiceType: ['01'],
    currency: ['MYR'],
    invoiceDate: [new Date()],
    dueDate: [this.getDefaultDueDate()],
    paymentTerms: [''],
    isSelfBilled: [false],
    notes: ['']
  });

  // Step 2: Parties Form
  supplierForm: FormGroup = this.fb.group({
    name: [''],
    tin: [''],
    brn: [''],
    sstNo: [''],
    msicCode: [''],
    address: [''],
    phone: [''],
    email: ['']
  });

  buyerForm: FormGroup = this.fb.group({
    name: [''],
    tin: [''],
    brn: [''],
    address: [''],
    phone: [''],
    email: ['']
  });

  // Step 3: Line Items
  items: LineItem[] = [];

  // TIN validation
  tinValidating = signal(false);
  tinValidationResult = signal<string | null>(null);

  readonly TYPE_LABELS = INVOICE_TYPE_LABELS;
  readonly TAX_TYPES: TaxType[] = ['SST', 'Service Tax', 'Exempt', 'Zero Rated'];
  readonly TAX_RATES: Record<string, number> = { 'SST': 6, 'Service Tax': 8, 'Exempt': 0, 'Zero Rated': 0 };

  readonly invoiceTypes = [
    { value: '01', label: 'Invoice' },
    { value: '02', label: 'Credit Note' },
    { value: '03', label: 'Debit Note' },
    { value: '04', label: 'Refund Note' }
  ];

  readonly currencies = [
    { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' }
  ];

  readonly paymentTermOptions = [
    { value: 'Due on Receipt', label: 'Due on Receipt' },
    { value: 'Net 15', label: 'Net 15' },
    { value: 'Net 30', label: 'Net 30' },
    { value: 'Net 60', label: 'Net 60' },
    { value: 'Net 90', label: 'Net 90' }
  ];

  ngOnInit() {
    if (this.dialogData?.invoice) {
      this.isEditMode = true;
      this.invoicePublicId = this.dialogData.invoice.public_id;
      this.populateForm(this.dialogData.invoice);
    } else {
      this.addItem();
    }
  }

  private getDefaultDueDate(): Date {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    return due;
  }

  // ─── Unified Active Section ───────────────────────────────
  // Maps both stepper (create) and segmented (edit) to a single section key

  private readonly stepToSection: Record<number, string> = {
    1: 'details', 2: 'parties', 3: 'items', 4: 'review'
  };
  private readonly sectionToStep: Record<string, number> = {
    'details': 1, 'parties': 2, 'items': 3, 'review': 4
  };

  get activeSection(): string {
    return this.isEditMode ? this.activeTab : this.stepToSection[this.currentStep];
  }

  // ─── Populate Form (Edit Mode) ────────────────────────────

  private populateForm(invoice: Invoice) {
    this.detailsForm.patchValue({
      invoiceType: invoice.invoice_type,
      currency: invoice.currency,
      invoiceDate: invoice.invoice_date ? new Date(invoice.invoice_date) : new Date(),
      dueDate: invoice.due_date ? new Date(invoice.due_date) : null,
      paymentTerms: invoice.payment_terms || '',
      isSelfBilled: invoice.is_self_billed,
      notes: invoice.notes || ''
    });

    this.supplierForm.patchValue({
      name: invoice.supplier_name,
      tin: invoice.supplier_tin || '',
      brn: invoice.supplier_brn || '',
      sstNo: invoice.supplier_sst_no || '',
      msicCode: invoice.supplier_msic_code || '',
      address: invoice.supplier_address || '',
      phone: invoice.supplier_phone || '',
      email: invoice.supplier_email || ''
    });

    this.buyerForm.patchValue({
      name: invoice.buyer_name,
      tin: invoice.buyer_tin || '',
      brn: invoice.buyer_brn || '',
      address: invoice.buyer_address || '',
      phone: invoice.buyer_phone || '',
      email: invoice.buyer_email || ''
    });

    this.items = (invoice.items || []).map(item => ({
      description: item.description,
      quantity: +item.quantity,
      unit_price: +item.unit_price,
      discount_amount: +item.discount_amount,
      discount_rate: +item.discount_rate,
      tax_type: item.tax_type,
      tax_rate: +item.tax_rate,
      classification_code: item.classification_code || '',
      unit_of_measurement: item.unit_of_measurement || 'EA',
      subtotal: +item.subtotal,
      tax_amount: +item.tax_amount,
      total: +item.total
    }));

    if (this.items.length === 0) this.addItem();
  }

  // ─── Form Value Helpers ─────────────────────────────────

  get invoiceType(): string { return this.detailsForm.get('invoiceType')?.value || '01'; }
  get currency(): string { return this.detailsForm.get('currency')?.value || 'MYR'; }
  get isSelfBilled(): boolean { return this.detailsForm.get('isSelfBilled')?.value || false; }
  get notes(): string { return this.detailsForm.get('notes')?.value || ''; }
  get paymentTerms(): string { return this.detailsForm.get('paymentTerms')?.value || ''; }

  get invoiceDateValue(): Date | null { return this.detailsForm.get('invoiceDate')?.value; }
  get dueDateValue(): Date | null { return this.detailsForm.get('dueDate')?.value; }

  get supplierName(): string { return this.supplierForm.get('name')?.value || ''; }
  get supplierTin(): string { return this.supplierForm.get('tin')?.value || ''; }
  get supplierAddress(): string { return this.supplierForm.get('address')?.value || ''; }
  get buyerName(): string { return this.buyerForm.get('name')?.value || ''; }
  get buyerTin(): string { return this.buyerForm.get('tin')?.value || ''; }
  get buyerAddress(): string { return this.buyerForm.get('address')?.value || ''; }

  // ─── Stepper (Create mode) ────────────────────────────────

  nextStep() {
    if (this.currentStep < 4) this.currentStep++;
  }

  previousStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  goToStep(step: number) {
    if (step <= this.currentStep || this.isStepValid(step - 1)) {
      this.currentStep = step;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1: return !!this.invoiceDateValue;
      case 2: return !!this.supplierName.trim() && !!this.buyerName.trim();
      case 3: return this.items.length > 0 && this.items.every(i => i.description.trim() && i.unit_price >= 0);
      default: return true;
    }
  }

  canProceed(): boolean {
    return this.isStepValid(this.currentStep);
  }

  // ─── Segmented Tab (Edit mode) ────────────────────────────

  onTabChange(value: string) {
    this.activeTab = value;
  }

  // Navigate to a section — works for both modes
  goToSection(section: string) {
    if (this.isEditMode) {
      this.activeTab = section;
    } else {
      this.currentStep = this.sectionToStep[section] || 1;
    }
  }

  // ─── Line Items ─────────────────────────────────────────

  addItem() {
    this.items.push({
      description: '', quantity: 1, unit_price: 0,
      discount_amount: 0, discount_rate: 0,
      tax_type: 'Exempt', tax_rate: 0,
      classification_code: '', unit_of_measurement: 'EA',
      subtotal: 0, tax_amount: 0, total: 0
    });
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
      this.recalculateAll();
    }
  }

  onTaxTypeChange(item: LineItem) {
    item.tax_rate = this.TAX_RATES[item.tax_type] || 0;
    this.recalculateItem(item);
  }

  recalculateItem(item: LineItem) {
    const qty = +item.quantity || 0;
    const price = +item.unit_price || 0;
    const lineTotal = qty * price;
    const discount = +item.discount_amount > 0 ? +item.discount_amount : (lineTotal * (+item.discount_rate || 0) / 100);
    item.subtotal = parseFloat((lineTotal - discount).toFixed(2));
    item.tax_amount = parseFloat((item.subtotal * (+item.tax_rate || 0) / 100).toFixed(2));
    item.total = parseFloat((item.subtotal + item.tax_amount).toFixed(2));
  }

  recalculateAll() {
    this.items.forEach(item => this.recalculateItem(item));
  }

  get grandSubtotal(): number { return this.items.reduce((sum, i) => sum + (+i.subtotal || 0), 0); }
  get grandDiscount(): number { return this.items.reduce((sum, i) => sum + (+i.discount_amount || 0), 0); }
  get grandTax(): number { return this.items.reduce((sum, i) => sum + (+i.tax_amount || 0), 0); }
  get grandTotal(): number { return this.items.reduce((sum, i) => sum + (+i.total || 0), 0); }

  // ─── TIN Validation ─────────────────────────────────────

  validateTin(tin: string) {
    if (!tin) return;
    this.tinValidating.set(true);
    this.tinValidationResult.set(null);
    this.invoiceService.validateTin(tin).subscribe({
      next: (res) => {
        this.tinValidationResult.set(res.data.isValid ? `Valid: ${res.data.name}` : res.data.message);
        this.tinValidating.set(false);
      },
      error: () => {
        this.tinValidationResult.set('Validation failed');
        this.tinValidating.set(false);
      }
    });
  }

  // ─── Save ───────────────────────────────────────────────

  private formatDateToString(date: Date | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  save(andApprove = false) {
    if (!this.validateAll()) return;
    this.saving.set(true);

    const s = this.supplierForm.value;
    const b = this.buyerForm.value;

    const data: any = {
      invoice_type: this.invoiceType,
      is_self_billed: this.isSelfBilled,
      invoice_date: this.formatDateToString(this.invoiceDateValue),
      due_date: this.formatDateToString(this.dueDateValue),
      payment_terms: this.paymentTerms || null,
      currency: this.currency,
      notes: this.notes || null,
      supplier_name: s.name,
      supplier_tin: s.tin || null,
      supplier_brn: s.brn || null,
      supplier_sst_no: s.sstNo || null,
      supplier_address: s.address || null,
      supplier_phone: s.phone || null,
      supplier_email: s.email || null,
      supplier_msic_code: s.msicCode || null,
      buyer_name: b.name,
      buyer_tin: b.tin || null,
      buyer_brn: b.brn || null,
      buyer_address: b.address || null,
      buyer_phone: b.phone || null,
      buyer_email: b.email || null,
      status: andApprove ? 'Pending' : 'Draft',
      items: this.items.map(item => ({
        description: item.description, quantity: item.quantity,
        unit_price: item.unit_price, discount_amount: item.discount_amount,
        discount_rate: item.discount_rate, tax_type: item.tax_type,
        tax_rate: item.tax_rate, classification_code: item.classification_code || null,
        unit_of_measurement: item.unit_of_measurement || 'EA'
      }))
    };

    const request = this.isEditMode
      ? this.invoiceService.updateInvoice(this.invoicePublicId!, data)
      : this.invoiceService.createInvoice(data);

    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.dialogData?.onSuccess?.(res.data);
          this.dialogRef.close(res.data);
        }
      },
      error: () => this.saving.set(false)
    });
  }

  validateAll(): boolean {
    if (!this.invoiceDateValue) return false;
    if (!this.supplierName.trim() || !this.buyerName.trim()) return false;
    if (this.items.length === 0) return false;
    return this.items.every(i => i.description.trim() && i.unit_price >= 0);
  }

  close() {
    this.dialogRef.close();
  }

  // ─── Helpers ────────────────────────────────────────────

  formatCurrency(amount: number | string): string {
    return (+amount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getTypeLabel(): string {
    return this.TYPE_LABELS[this.invoiceType] || 'Invoice';
  }

  formatDate(date: Date | string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
