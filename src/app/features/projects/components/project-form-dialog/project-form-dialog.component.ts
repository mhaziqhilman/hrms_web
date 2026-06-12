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

import { ProjectService } from '../../services/project.service';
import { Project, ProjectStatus } from '../../models/project.model';
import { FileService } from '@/core/services/file.service';
import { API_CONFIG } from '@/core/config/api.config';

type ProjectSource = 'manual' | 'po';

interface StepConfig {
  number: number;
  label: string;
}

export interface ProjectFormDialogData {
  project?: Project;
  source?: ProjectSource;
  onSuccess?: (project: Project) => void;
}

@Component({
  selector: 'app-project-form-dialog',
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
  templateUrl: './project-form-dialog.component.html',
  styleUrls: ['./project-form-dialog.component.css']
})
export class ProjectFormDialogComponent implements OnInit {
  private projectService = inject(ProjectService);
  private fileService = inject(FileService);
  private dialogRef = inject(ZardDialogRef);
  private dialogData = inject(Z_MODAL_DATA, { optional: true }) as ProjectFormDialogData | null;
  private fb = inject(FormBuilder);

  // Mode
  isEditMode = false;
  private projectPublicId: string | null = null;

  // Source toggle
  source = signal<ProjectSource>('manual');

  // Stepper (create mode)
  currentStep = 1;
  readonly steps: StepConfig[] = [
    { number: 1, label: 'Project Info' },
    { number: 2, label: 'Budget & PO' },
    { number: 3, label: 'Review' }
  ];

  // Segmented (edit mode)
  activeTab = 'info';
  readonly tabOptions: SegmentedOption[] = [
    { value: 'info', label: 'Project Info' },
    { value: 'budget', label: 'Budget & PO' },
    { value: 'review', label: 'Review' }
  ];

  // State
  loading = signal(false);
  saving = signal(false);
  uploadingPo = signal(false);
  poFileName = signal<string>('');

  // Step 1: Project Info
  infoForm: FormGroup = this.fb.group({
    code: [''],
    name: [''],
    status: ['Planning' as ProjectStatus],
    clientName: [''],
    description: ['']
  });

  // Step 2: Budget & PO
  budgetForm: FormGroup = this.fb.group({
    startDate: [null as Date | null],
    endDate: [null as Date | null],
    currency: ['MYR'],
    budget: [null as number | null],
    poNumber: [''],
    poDate: [null as Date | null],
    poCurrency: ['MYR'],
    poValue: [null as number | null],
    poDurationMonths: [null as number | null],
    poDocumentUrl: [''],
    notes: ['']
  });

  readonly statuses: { value: ProjectStatus; label: string }[] = [
    { value: 'Planning', label: 'Planning' },
    { value: 'Active', label: 'Active' },
    { value: 'On_Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  readonly currencies = [
    { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' }
  ];

  ngOnInit() {
    if (this.dialogData?.project) {
      this.isEditMode = true;
      this.projectPublicId = this.dialogData.project.public_id;
      this.populateForm(this.dialogData.project);
    } else if (this.dialogData?.source) {
      this.source.set(this.dialogData.source);
    }
  }

  // ─── Unified active section ──────────────────────────────
  private readonly stepToSection: Record<number, string> = {
    1: 'info', 2: 'budget', 3: 'review'
  };
  private readonly sectionToStep: Record<string, number> = {
    'info': 1, 'budget': 2, 'review': 3
  };

  get activeSection(): string {
    return this.isEditMode ? this.activeTab : this.stepToSection[this.currentStep];
  }

  // Parse a backend date (YYYY-MM-DD or ISO) into a LOCAL-time Date.
  // `new Date('2025-07-01')` parses as UTC midnight, which can render as
  // the previous day in negative-offset timezones — build it locally instead.
  private parseDateLocal(value: string | null | undefined): Date | null {
    if (!value) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  // ─── Populate (Edit) ────────────────────────────────────
  private populateForm(p: Project) {
    this.infoForm.patchValue({
      code: p.code,
      name: p.name,
      status: p.status,
      clientName: p.client_name || '',
      description: p.description || ''
    });

    this.budgetForm.patchValue({
      startDate: this.parseDateLocal(p.start_date),
      endDate: this.parseDateLocal(p.end_date),
      currency: p.currency || 'MYR',
      budget: p.budget != null ? +p.budget : null,
      poNumber: p.po_number || '',
      poDate: this.parseDateLocal(p.po_date),
      poCurrency: p.po_currency || p.currency || 'MYR',
      poValue: p.po_value != null ? +p.po_value : null,
      poDurationMonths: p.po_duration_months ?? null,
      poDocumentUrl: p.po_document_url || '',
      notes: p.notes || ''
    });

    if (p.po_number || p.po_value) this.source.set('po');
  }

  // ─── Source toggle ───────────────────────────────────────
  setSource(s: ProjectSource) {
    this.source.set(s);
    if (s === 'manual') {
      this.budgetForm.patchValue({
        poNumber: '', poDate: null, poValue: null,
        poDurationMonths: null, poDocumentUrl: ''
      });
      this.poFileName.set('');
    } else if (!this.budgetForm.value.poCurrency) {
      this.budgetForm.patchValue({ poCurrency: this.budgetForm.value.currency || 'MYR' });
    }
  }

  // ─── PO file upload ──────────────────────────────────────
  onPoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const v = this.fileService.validateFile(file);
    if (!v.valid) { alert(v.error || 'Invalid file'); return; }

    this.uploadingPo.set(true);
    this.fileService.uploadFiles([file], { category: 'company_document', sub_category: 'po-document' }).subscribe({
      next: res => {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        if (data?.id) {
          this.budgetForm.patchValue({ poDocumentUrl: `${API_CONFIG.apiUrl}/files/${data.id}/preview` });
        }
        this.poFileName.set(file.name);
        this.uploadingPo.set(false);
      },
      error: () => this.uploadingPo.set(false)
    });
  }

  syncPoToBudget() {
    const b = this.budgetForm.value;
    if (this.source() === 'po' && b.poValue != null && (b.budget == null || b.budget === '')) {
      this.budgetForm.patchValue({ budget: b.poValue });
    }
    if (b.poCurrency && !b.currency) {
      this.budgetForm.patchValue({ currency: b.poCurrency });
    }
  }

  // ─── Helpers / Getters ──────────────────────────────────
  get code(): string { return this.infoForm.get('code')?.value || ''; }
  get name(): string { return this.infoForm.get('name')?.value || ''; }
  get status(): ProjectStatus { return this.infoForm.get('status')?.value || 'Planning'; }
  get clientName(): string { return this.infoForm.get('clientName')?.value || ''; }
  get description(): string { return this.infoForm.get('description')?.value || ''; }

  get startDateValue(): Date | null { return this.budgetForm.get('startDate')?.value || null; }
  get endDateValue(): Date | null { return this.budgetForm.get('endDate')?.value || null; }
  get currency(): string { return this.budgetForm.get('currency')?.value || 'MYR'; }
  get budget(): number | null { return this.budgetForm.get('budget')?.value ?? null; }
  get poNumber(): string { return this.budgetForm.get('poNumber')?.value || ''; }
  get poDateValue(): Date | null { return this.budgetForm.get('poDate')?.value || null; }
  get poCurrency(): string { return this.budgetForm.get('poCurrency')?.value || 'MYR'; }
  get poValue(): number | null { return this.budgetForm.get('poValue')?.value ?? null; }
  get poDurationMonths(): number | null { return this.budgetForm.get('poDurationMonths')?.value ?? null; }
  get poDocumentUrl(): string { return this.budgetForm.get('poDocumentUrl')?.value || ''; }
  get notes(): string { return this.budgetForm.get('notes')?.value || ''; }

  get statusLabel(): string {
    return this.statuses.find(s => s.value === this.status)?.label || this.status;
  }

  // ─── Stepper / Segmented ────────────────────────────────
  nextStep() { if (this.currentStep < 3) this.currentStep++; }
  previousStep() { if (this.currentStep > 1) this.currentStep--; }

  goToStep(step: number) {
    if (step <= this.currentStep || this.isStepValid(step - 1)) {
      this.currentStep = step;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1: return !!this.code.trim() && !!this.name.trim();
      case 2: return this.source() !== 'po' || !!this.poNumber.trim();
      default: return true;
    }
  }

  canProceed(): boolean { return this.isStepValid(this.currentStep); }

  onTabChange(value: string) { this.activeTab = value; }

  goToSection(section: string) {
    if (this.isEditMode) this.activeTab = section;
    else this.currentStep = this.sectionToStep[section] || 1;
  }

  // ─── Save ────────────────────────────────────────────────
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
    this.syncPoToBudget();
    this.saving.set(true);

    const payload: any = {
      code: this.code,
      name: this.name,
      status: this.status,
      client_name: this.clientName || null,
      description: this.description || null,
      currency: this.currency,
      notes: this.notes || null
    };

    const startDate = this.formatDateToString(this.startDateValue);
    const endDate = this.formatDateToString(this.endDateValue);
    if (startDate) payload.start_date = startDate;
    if (endDate) payload.end_date = endDate;
    if (this.budget != null && (this.budget as any) !== '') payload.budget = this.budget;

    if (this.source() === 'po') {
      payload.po_number = this.poNumber;
      const poDate = this.formatDateToString(this.poDateValue);
      if (poDate) payload.po_date = poDate;
      payload.po_currency = this.poCurrency;
      if (this.poValue != null && (this.poValue as any) !== '') payload.po_value = this.poValue;
      if (this.poDurationMonths != null && (this.poDurationMonths as any) !== '') {
        payload.po_duration_months = this.poDurationMonths;
      }
      if (this.poDocumentUrl) payload.po_document_url = this.poDocumentUrl;
    }

    const request = this.isEditMode
      ? this.projectService.update(this.projectPublicId!, payload)
      : this.projectService.create(payload);

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
    if (!this.code.trim() || !this.name.trim()) return false;
    if (this.source() === 'po' && !this.poNumber.trim()) return false;
    return true;
  }

  close() {
    this.dialogRef.close();
  }

  // ─── Helpers ────────────────────────────────────────────
  formatCurrency(amount: number | string | null | undefined): string {
    if (amount == null || amount === '') return '—';
    return (+amount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: Date | string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
