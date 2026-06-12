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
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';
import { ZardSegmentedComponent, SegmentedOption } from '@/shared/components/segmented/segmented.component';

import { FinanceService } from '../../services/finance.service';
import { Bill, BillType } from '../../models/finance.model';
import { ProjectService } from '@/features/projects/services/project.service';
import { Project } from '@/features/projects/models/project.model';

interface BillLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

interface StepConfig {
  number: number;
  label: string;
}

export interface BillFormDialogData {
  bill?: Bill;
  projectPublicId?: string;
  onSuccess?: (bill: any) => void;
}

@Component({
  selector: 'app-bill-form-dialog',
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
    ZardTooltipModule,
    ZardSegmentedComponent
  ],
  templateUrl: './bill-form-dialog.component.html',
  styleUrls: ['./bill-form-dialog.component.css']
})
export class BillFormDialogComponent implements OnInit {
  private financeService = inject(FinanceService);
  private projectService = inject(ProjectService);
  private dialogRef = inject(ZardDialogRef);
  private dialogData = inject(Z_MODAL_DATA, { optional: true }) as BillFormDialogData | null;
  private fb = inject(FormBuilder);

  // Mode
  isEditMode = false;
  private billPublicId: string | null = null;

  // Projects
  projects = signal<Project[]>([]);

  // Stepper (create mode)
  currentStep = 1;
  readonly steps: StepConfig[] = [
    { number: 1, label: 'Bill Details' },
    { number: 2, label: 'Vendor' },
    { number: 3, label: 'Line Items' },
    { number: 4, label: 'Review' }
  ];

  // Segmented (edit mode)
  activeTab = 'details';
  readonly tabOptions: SegmentedOption[] = [
    { value: 'details', label: 'Bill Details' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'items', label: 'Line Items' },
    { value: 'review', label: 'Review' }
  ];

  // State
  loading = signal(false);
  saving = signal(false);
  vendorExpanded = true;

  // Step 1: Bill Details
  detailsForm: FormGroup = this.fb.group({
    billType: ['Bill' as BillType],
    billDate: [new Date()],
    dueDate: [this.getDefaultDueDate()],
    projectPublicId: [''],
    category: [''],
    currency: ['MYR'],
    notes: ['']
  });

  // Step 2: Vendor
  vendorForm: FormGroup = this.fb.group({
    name: [''],
    invoiceNumber: [''],
    tin: [''],
    email: [''],
    address: ['']
  });

  // Step 3: Line Items
  items: BillLineItem[] = [];

  readonly billTypes: { value: BillType; label: string }[] = [
    { value: 'Bill', label: 'Bill' },
    { value: 'PO', label: 'Purchase Order' },
    { value: 'Expense', label: 'Expense' }
  ];

  readonly currencies = [
    { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' }
  ];

  ngOnInit() {
    this.loadProjects();
    if (this.dialogData?.bill) {
      this.isEditMode = true;
      this.billPublicId = this.dialogData.bill.public_id;
      this.populateForm(this.dialogData.bill);
    } else {
      this.addItem();
      if (this.dialogData?.projectPublicId) {
        this.detailsForm.patchValue({ projectPublicId: this.dialogData.projectPublicId });
      }
    }
  }

  loadProjects() {
    this.projectService.list({ limit: 200 }).subscribe({
      next: res => this.projects.set(res.data.projects)
    });
  }

  private getDefaultDueDate(): Date {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    return due;
  }

  // ─── Unified active section ──────────────────────────────
  private readonly stepToSection: Record<number, string> = {
    1: 'details', 2: 'vendor', 3: 'items', 4: 'review'
  };
  private readonly sectionToStep: Record<string, number> = {
    'details': 1, 'vendor': 2, 'items': 3, 'review': 4
  };

  get activeSection(): string {
    return this.isEditMode ? this.activeTab : this.stepToSection[this.currentStep];
  }

  // ─── Populate Form (Edit Mode) ────────────────────────────
  private populateForm(bill: Bill) {
    this.detailsForm.patchValue({
      billType: bill.bill_type,
      billDate: bill.bill_date ? new Date(bill.bill_date) : new Date(),
      dueDate: bill.due_date ? new Date(bill.due_date) : null,
      projectPublicId: bill.project?.public_id || '',
      category: bill.category || '',
      currency: bill.currency,
      notes: bill.notes || ''
    });

    this.vendorForm.patchValue({
      name: bill.vendor_name,
      invoiceNumber: bill.vendor_invoice_number || '',
      tin: bill.vendor_tin || '',
      email: bill.vendor_email || '',
      address: bill.vendor_address || ''
    });

    this.items = (bill.items || []).map(it => ({
      description: it.description,
      quantity: +it.quantity,
      unit_price: +it.unit_price,
      tax_rate: +it.tax_rate
    }));

    if (this.items.length === 0) this.addItem();
  }

  // ─── Form Value Helpers ─────────────────────────────────
  get billType(): BillType { return this.detailsForm.get('billType')?.value || 'Bill'; }
  get currency(): string { return this.detailsForm.get('currency')?.value || 'MYR'; }
  get notes(): string { return this.detailsForm.get('notes')?.value || ''; }
  get category(): string { return this.detailsForm.get('category')?.value || ''; }
  get billDateValue(): Date | null { return this.detailsForm.get('billDate')?.value; }
  get dueDateValue(): Date | null { return this.detailsForm.get('dueDate')?.value; }
  get projectPublicId(): string { return this.detailsForm.get('projectPublicId')?.value || ''; }

  get vendorName(): string { return this.vendorForm.get('name')?.value || ''; }
  get vendorTin(): string { return this.vendorForm.get('tin')?.value || ''; }
  get vendorAddress(): string { return this.vendorForm.get('address')?.value || ''; }
  get vendorEmail(): string { return this.vendorForm.get('email')?.value || ''; }
  get vendorInvoiceNumber(): string { return this.vendorForm.get('invoiceNumber')?.value || ''; }

  get linkedProject(): Project | null {
    const id = this.projectPublicId;
    if (!id) return null;
    return this.projects().find(p => p.public_id === id) || null;
  }

  getTypeLabel(): string {
    return this.billTypes.find(b => b.value === this.billType)?.label || 'Bill';
  }

  // ─── Stepper ────────────────────────────────────────────
  nextStep() { if (this.currentStep < 4) this.currentStep++; }
  previousStep() { if (this.currentStep > 1) this.currentStep--; }

  goToStep(step: number) {
    if (step <= this.currentStep || this.isStepValid(step - 1)) {
      this.currentStep = step;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1: return !!this.billDateValue;
      case 2: return !!this.vendorName.trim();
      case 3: return this.items.length > 0 && this.items.every(i => i.description.trim() && i.unit_price >= 0);
      default: return true;
    }
  }

  canProceed(): boolean {
    return this.isStepValid(this.currentStep);
  }

  onTabChange(value: string) { this.activeTab = value; }

  goToSection(section: string) {
    if (this.isEditMode) {
      this.activeTab = section;
    } else {
      this.currentStep = this.sectionToStep[section] || 1;
    }
  }

  // ─── Line Items ─────────────────────────────────────────
  addItem() {
    this.items.push({ description: '', quantity: 1, unit_price: 0, tax_rate: 0 });
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
    }
  }

  itemSubtotal(item: BillLineItem): number {
    return (+item.quantity || 0) * (+item.unit_price || 0);
  }

  itemTax(item: BillLineItem): number {
    return this.itemSubtotal(item) * ((+item.tax_rate || 0) / 100);
  }

  itemTotal(item: BillLineItem): number {
    return this.itemSubtotal(item) + this.itemTax(item);
  }

  get grandSubtotal(): number {
    return this.items.reduce((sum, i) => sum + this.itemSubtotal(i), 0);
  }

  get grandTax(): number {
    return this.items.reduce((sum, i) => sum + this.itemTax(i), 0);
  }

  get grandTotal(): number {
    return this.items.reduce((sum, i) => sum + this.itemTotal(i), 0);
  }

  // ─── Save ───────────────────────────────────────────────
  // Format a Date as YYYY-MM-DD using LOCAL components.
  // Never use toISOString() here — it converts to UTC and shifts the
  // date back a day for timezones ahead of UTC (e.g. Malaysia, UTC+8).
  private formatDateToString(date: Date | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  save() {
    if (!this.validateAll()) return;
    this.saving.set(true);

    const payload: any = {
      bill_type: this.billType,
      bill_date: this.formatDateToString(this.billDateValue),
      due_date: this.formatDateToString(this.dueDateValue),
      vendor_name: this.vendorName,
      vendor_invoice_number: this.vendorInvoiceNumber || null,
      vendor_tin: this.vendorTin || null,
      vendor_email: this.vendorEmail || null,
      vendor_address: this.vendorAddress || null,
      category: this.category || null,
      currency: this.currency,
      project_public_id: this.projectPublicId || null,
      notes: this.notes || null,
      items: this.items.map(it => ({
        description: it.description,
        quantity: +it.quantity || 0,
        unit_price: +it.unit_price || 0,
        tax_rate: +it.tax_rate || 0
      }))
    };

    const request = this.isEditMode
      ? this.financeService.updateBill(this.billPublicId!, payload)
      : this.financeService.createBill(payload);

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
    if (!this.billDateValue) return false;
    if (!this.vendorName.trim()) return false;
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

  formatDate(date: Date | string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
