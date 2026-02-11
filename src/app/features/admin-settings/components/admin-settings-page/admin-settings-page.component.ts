import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminSettingsService } from '../../services/admin-settings.service';
import {
  LeaveTypeConfig, ClaimTypeConfig, PublicHoliday,
  StatutoryConfigItem, EmailTemplateItem, CompanyProfile
} from '../../models/admin-settings.models';

import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardFormControlComponent } from '@/shared/components/form/form-control.component';
import { ZardFormMessageComponent } from '@/shared/components/form/form-message.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardIcon } from '@/shared/components/icon/icons';

type SectionType = 'company' | 'leave-types' | 'claim-types' | 'holidays' | 'payroll-config' | 'email-templates';

@Component({
  selector: 'app-admin-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardCheckboxComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardDividerComponent,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardFormControlComponent,
    ZardFormMessageComponent,
    ZardDatePickerComponent
  ],
  templateUrl: './admin-settings-page.component.html',
  styleUrls: ['./admin-settings-page.component.css']
})
export class AdminSettingsPageComponent implements OnInit {
  private service = inject(AdminSettingsService);
  private alertDialog = inject(ZardAlertDialogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  activeSection = signal<SectionType>('company');

  navItems: { id: SectionType; label: string; icon: ZardIcon }[] = [
    { id: 'company', label: 'Company Profile', icon: 'building' },
    { id: 'leave-types', label: 'Leave Types', icon: 'calendar' },
    { id: 'claim-types', label: 'Claim Types', icon: 'file-text' },
    { id: 'holidays', label: 'Public Holidays', icon: 'calendar' },
    { id: 'payroll-config', label: 'Payroll Config', icon: 'circle-dollar-sign' },
    { id: 'email-templates', label: 'Email Templates', icon: 'mail' }
  ];

  loading = signal(false);
  saving = signal(false);

  // ─── Company ────────────────────────────────────────────────
  company = signal<CompanyProfile | null>(null);
  companyForm: Partial<CompanyProfile> = {};
  logoPreview = signal<string | null>(null);
  logoFile: File | null = null;

  industries = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
    'Retail', 'Construction', 'Services', 'Government', 'Other'
  ];

  sizes = ['1-10', '11-50', '51-200', '201-500', '500+'];

  // ─── Leave Types ────────────────────────────────────────────
  leaveTypes = signal<LeaveTypeConfig[]>([]);
  showLeaveTypeDialog = signal(false);
  editingLeaveType: Partial<LeaveTypeConfig> | null = null;
  leaveTypeForm: Partial<LeaveTypeConfig> = {};

  // ─── Claim Types ────────────────────────────────────────────
  claimTypes = signal<ClaimTypeConfig[]>([]);
  showClaimTypeDialog = signal(false);
  editingClaimType: Partial<ClaimTypeConfig> | null = null;
  claimTypeForm: Partial<ClaimTypeConfig> = {};

  // ─── Public Holidays ───────────────────────────────────────
  holidays = signal<PublicHoliday[]>([]);
  showHolidayDialog = signal(false);
  editingHoliday: Partial<PublicHoliday> | null = null;
  holidayForm: Partial<PublicHoliday> = {};
  selectedYear = signal(new Date().getFullYear());
  years = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

  // ─── Statutory Config ──────────────────────────────────────
  statutoryConfigs = signal<StatutoryConfigItem[]>([]);
  statutoryEditing = signal(false);
  statutoryForm: Record<string, string> = {};

  // ─── Email Templates ───────────────────────────────────────
  emailTemplates = signal<EmailTemplateItem[]>([]);
  expandedTemplate = signal<string | null>(null);
  editingTemplate: Partial<EmailTemplateItem> | null = null;
  templatePreview = signal<{ subject: string; body: string } | null>(null);

  templateLabels: Record<string, string> = {
    password_reset: 'Password Reset',
    payslip: 'Payslip Notification',
    leave_status: 'Leave Status',
    welcome: 'Welcome Email',
    verification: 'Email Verification',
    invitation: 'Invitation Email'
  };

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const section = params['section'] as SectionType;
      if (section) {
        this.activeSection.set(section);
        this.loadSectionData(section);
      }
    });
  }

  setSection(section: SectionType): void {
    this.router.navigate(['/admin-settings', section]);
  }

  getNavItemClass(id: SectionType): string {
    const base = 'inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none px-3 py-2';
    if (this.activeSection() === id) {
      return `${base} bg-muted text-foreground`;
    }
    return `${base} text-muted-foreground hover:bg-muted/50 hover:text-foreground`;
  }

  private loadSectionData(section: SectionType): void {
    this.loading.set(true);
    switch (section) {
      case 'company': this.loadCompany(); break;
      case 'leave-types': this.loadLeaveTypes(); break;
      case 'claim-types': this.loadClaimTypes(); break;
      case 'holidays': this.loadHolidays(); break;
      case 'payroll-config': this.loadStatutoryConfig(); break;
      case 'email-templates': this.loadEmailTemplates(); break;
    }
  }

  // ─── Company Methods ────────────────────────────────────────
  loadCompany(): void {
    this.service.getCompany().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.company.set(res.data);
          this.companyForm = { ...res.data };
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  saveCompany(): void {
    this.saving.set(true);
    this.service.updateCompany(this.companyForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.company.set(res.data);
          this.companyForm = { ...res.data };
        }
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.logoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.logoPreview.set(reader.result as string);
      reader.readAsDataURL(this.logoFile);
    }
  }

  uploadLogo(): void {
    if (!this.logoFile) return;
    this.saving.set(true);
    this.service.uploadLogo(this.logoFile).subscribe({
      next: (res) => {
        if (res.success) {
          this.companyForm.logo_url = res.data.logo_url;
          this.logoFile = null;
        }
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  // ─── Leave Type Methods ─────────────────────────────────────
  loadLeaveTypes(): void {
    this.service.getLeaveTypes().subscribe({
      next: (res) => {
        if (res.success) this.leaveTypes.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openLeaveTypeDialog(leaveType?: LeaveTypeConfig): void {
    this.editingLeaveType = leaveType || null;
    this.leaveTypeForm = leaveType ? { ...leaveType } : {
      name: '', days_per_year: 0, is_paid: true, carry_forward_allowed: false,
      carry_forward_max_days: 0, prorate_for_new_joiners: true, requires_document: false, description: ''
    };
    this.showLeaveTypeDialog.set(true);
  }

  closeLeaveTypeDialog(): void {
    this.showLeaveTypeDialog.set(false);
    this.editingLeaveType = null;
  }

  saveLeaveType(): void {
    this.saving.set(true);
    const obs = this.editingLeaveType?.id
      ? this.service.updateLeaveType(this.editingLeaveType.id, this.leaveTypeForm)
      : this.service.createLeaveType(this.leaveTypeForm);

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          this.closeLeaveTypeDialog();
          this.loadLeaveTypes();
        }
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  toggleLeaveType(id: number): void {
    this.service.toggleLeaveType(id).subscribe({
      next: (res) => {
        if (res.success) this.loadLeaveTypes();
      }
    });
  }

  // ─── Claim Type Methods ─────────────────────────────────────
  loadClaimTypes(): void {
    this.service.getClaimTypes().subscribe({
      next: (res) => {
        if (res.success) this.claimTypes.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openClaimTypeDialog(claimType?: ClaimTypeConfig): void {
    this.editingClaimType = claimType || null;
    this.claimTypeForm = claimType ? { ...claimType } : {
      name: '', description: '', requires_receipt: true, max_amount: undefined
    };
    this.showClaimTypeDialog.set(true);
  }

  closeClaimTypeDialog(): void {
    this.showClaimTypeDialog.set(false);
    this.editingClaimType = null;
  }

  saveClaimType(): void {
    this.saving.set(true);
    const obs = this.editingClaimType?.id
      ? this.service.updateClaimType(this.editingClaimType.id, this.claimTypeForm)
      : this.service.createClaimType(this.claimTypeForm);

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          this.closeClaimTypeDialog();
          this.loadClaimTypes();
        }
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  toggleClaimType(id: number): void {
    this.service.toggleClaimType(id).subscribe({
      next: (res) => {
        if (res.success) this.loadClaimTypes();
      }
    });
  }

  // ─── Holiday Methods ────────────────────────────────────────
  loadHolidays(): void {
    this.service.getHolidays(this.selectedYear()).subscribe({
      next: (res) => {
        if (res.success) this.holidays.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.loading.set(true);
    this.loadHolidays();
  }

  openHolidayDialog(holiday?: PublicHoliday): void {
    this.editingHoliday = holiday || null;
    this.holidayForm = holiday ? { ...holiday } : {
      name: '', date: '', description: '', is_recurring: false
    };
    this.showHolidayDialog.set(true);
  }

  closeHolidayDialog(): void {
    this.showHolidayDialog.set(false);
    this.editingHoliday = null;
  }

  saveHoliday(): void {
    this.saving.set(true);
    const payload = { ...this.holidayForm } as Record<string, any>;
    // Convert Date object from date picker to YYYY-MM-DD string for API
    if (payload['date'] instanceof Date) {
      const d = payload['date'] as Date;
      payload['date'] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const obs = this.editingHoliday?.id
      ? this.service.updateHoliday(this.editingHoliday.id, payload)
      : this.service.createHoliday(payload);

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          this.closeHolidayDialog();
          this.loadHolidays();
        }
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  deleteHoliday(holiday: PublicHoliday): void {
    this.alertDialog.confirm({
      zTitle: 'Delete Holiday',
      zDescription: `Are you sure you want to delete "${holiday.name}"?`,
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.service.deleteHoliday(holiday.id).subscribe({
          next: () => this.loadHolidays()
        });
      }
    });
  }

  // ─── Statutory Config Methods ───────────────────────────────
  loadStatutoryConfig(): void {
    this.service.getStatutoryConfig().subscribe({
      next: (res) => {
        if (res.success) {
          this.statutoryConfigs.set(res.data);
          this.statutoryForm = {};
          for (const config of res.data) {
            this.statutoryForm[config.config_key] = config.config_value;
          }
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  startStatutoryEdit(): void {
    this.statutoryEditing.set(true);
  }

  cancelStatutoryEdit(): void {
    this.statutoryEditing.set(false);
    for (const config of this.statutoryConfigs()) {
      this.statutoryForm[config.config_key] = config.config_value;
    }
  }

  saveStatutoryConfig(): void {
    this.saving.set(true);
    const configs = Object.entries(this.statutoryForm).map(([config_key, config_value]) => ({
      config_key,
      config_value: String(config_value)
    }));

    this.service.updateStatutoryConfig(configs).subscribe({
      next: (res) => {
        if (res.success) {
          this.statutoryEditing.set(false);
          this.loadStatutoryConfig();
        }
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  getConfigLabel(key: string): string {
    const labels: Record<string, string> = {
      epf_employee_rate: 'EPF Employee Rate',
      epf_employer_rate_below_5000: 'EPF Employer Rate (≤ RM5,000)',
      epf_employer_rate_above_5000: 'EPF Employer Rate (> RM5,000)',
      epf_employer_threshold: 'EPF Employer Threshold (RM)',
      eis_rate: 'EIS Rate',
      eis_max_salary: 'EIS Max Salary (RM)',
      socso_max_salary: 'SOCSO Max Salary (RM)'
    };
    return labels[key] || key;
  }

  getConfigGroup(key: string): string {
    if (key.startsWith('epf_')) return 'EPF';
    if (key.startsWith('eis_')) return 'EIS';
    if (key.startsWith('socso_')) return 'SOCSO';
    return 'Other';
  }

  formatRate(value: string, key: string): string {
    if (key.includes('rate')) {
      return `${(parseFloat(value) * 100).toFixed(1)}%`;
    }
    return `RM ${parseFloat(value).toLocaleString()}`;
  }

  // ─── Email Template Methods ─────────────────────────────────
  loadEmailTemplates(): void {
    this.service.getEmailTemplates().subscribe({
      next: (res) => {
        if (res.success) this.emailTemplates.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleTemplateExpand(key: string): void {
    if (this.expandedTemplate() === key) {
      this.expandedTemplate.set(null);
      this.editingTemplate = null;
      this.templatePreview.set(null);
    } else {
      this.expandedTemplate.set(key);
      const template = this.emailTemplates().find(t => t.template_key === key);
      this.editingTemplate = template ? { ...template } : null;
      this.templatePreview.set(null);
    }
  }

  saveTemplate(): void {
    if (!this.editingTemplate?.template_key) return;
    this.saving.set(true);
    this.service.updateEmailTemplate(this.editingTemplate.template_key, {
      subject: this.editingTemplate.subject,
      body: this.editingTemplate.body
    }).subscribe({
      next: (res) => {
        if (res.success) this.loadEmailTemplates();
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  previewTemplate(key: string): void {
    this.service.previewEmailTemplate(key).subscribe({
      next: (res) => {
        if (res.success) this.templatePreview.set(res.data);
      }
    });
  }

  resetTemplate(key: string): void {
    this.alertDialog.confirm({
      zTitle: 'Reset Template',
      zDescription: 'This will reset the template to its default content. Are you sure?',
      zOkText: 'Reset',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.service.resetEmailTemplate(key).subscribe({
          next: (res) => {
            if (res.success) {
              this.loadEmailTemplates();
              this.expandedTemplate.set(null);
            }
          }
        });
      }
    });
  }

  formatDateDisplay(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}
