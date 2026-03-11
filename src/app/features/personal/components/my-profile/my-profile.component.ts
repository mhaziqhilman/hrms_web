import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PersonalService } from '../../services/personal.service';
import { DisplayService } from '@/core/services/display.service';
import { EmployeeProfile, EmployeeDocument, UpdateProfileRequest } from '../../models/personal.model';
import { MyPayslipsComponent } from '../my-payslips/my-payslips.component';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardProgressBarComponent } from '@/shared/components/progress-bar/progress-bar.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';

export type ProfileTabId = 'personal' | 'employment' | 'contact' | 'payslips' | 'documents' | 'statutory';

export interface ProfileTabDef {
  id: ProfileTabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardBadgeComponent,
    ZardProgressBarComponent,
    ZardAvatarComponent,
    ZardDividerComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    MyPayslipsComponent
  ],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {
  private personalService = inject(PersonalService);
  private alertDialogService = inject(ZardAlertDialogService);
  private displayService = inject(DisplayService);

  // State
  loading = signal(false);
  hasProfile = signal(true);
  saving = signal(false);
  editMode = signal(false);
  profile = signal<EmployeeProfile | null>(null);

  // Tab management
  activeTab = signal<ProfileTabId>('personal');
  tabs: ProfileTabDef[] = [
    { id: 'personal', label: 'Personal Information', icon: 'user' },
    { id: 'employment', label: 'Employment', icon: 'briefcase' },
    { id: 'contact', label: 'Contact', icon: 'phone' },
    { id: 'payslips', label: 'Payslips', icon: 'wallet' },
    { id: 'documents', label: 'Documents', icon: 'folder-open' },
    { id: 'statutory', label: 'Statutory', icon: 'shield' },
  ];

  // Documents state
  documents = signal<EmployeeDocument[]>([]);
  loadingDocuments = signal(false);
  downloadingDoc = signal<number | null>(null);
  docSearch = '';
  docSort = 'uploaded_at';
  docOrder = 'DESC';

  // Editable form data
  formData: UpdateProfileRequest = {};

  // Computed: profile initials
  initials = computed(() => {
    const name = this.profile()?.full_name;
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  });

  // Computed: years of service
  yearsOfService = computed(() => {
    const joinDate = this.profile()?.join_date;
    if (!joinDate) return '0';
    const join = new Date(joinDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - join.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (years < 1) {
      const months = Math.floor((now.getTime() - join.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
      return `${months}m`;
    }
    return `${years}`;
  });

  // Computed: profile completion percentage
  profileCompletion = computed(() => {
    const p = this.profile();
    if (!p) return 0;

    const fields = [
      p.full_name,
      p.ic_no,
      p.date_of_birth,
      p.gender,
      p.marital_status,
      p.nationality,
      p.mobile,
      p.email,
      p.current_address,
      p.permanent_address,
      p.emergency_contact_name,
      p.emergency_contact_phone,
      p.position,
      p.department,
      p.bank_name,
      p.bank_account_no,
      p.epf_no,
      p.socso_no,
      p.tax_no,
      p.photo_url
    ];

    const filled = fields.filter(f => f !== null && f !== undefined && f !== '').length;
    return Math.round((filled / fields.length) * 100);
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  // --- Tab management ---

  setActiveTab(tabId: ProfileTabId): void {
    this.activeTab.set(tabId);
  }

  // --- Data loading ---

  loadProfile(): void {
    this.loading.set(true);

    this.personalService.getMyProfile().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          if (response.data.photo_url && !response.data.photo_url.startsWith('http')) {
            response.data.photo_url = null;
          }
          this.profile.set(response.data);
          this.hasProfile.set(true);
          this.resetFormData();
          this.loadDocuments();
        } else {
          this.hasProfile.set(false);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.hasProfile.set(false);
      }
    });
  }

  // --- Edit mode ---

  toggleEditMode(): void {
    if (this.editMode()) {
      this.resetFormData();
    }
    this.editMode.set(!this.editMode());
  }

  resetFormData(): void {
    const p = this.profile();
    if (p) {
      this.formData = {
        mobile: p.mobile || '',
        email: p.email || '',
        current_address: p.current_address || '',
        permanent_address: p.permanent_address || '',
        emergency_contact_name: p.emergency_contact_name || '',
        emergency_contact_phone: p.emergency_contact_phone || ''
      };
    }
  }

  saveProfile(): void {
    this.saving.set(true);

    this.personalService.updateMyProfile(this.formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.profile.set(response.data);
          this.editMode.set(false);
          this.alertDialogService.info({
            zTitle: 'Success',
            zDescription: 'Profile updated successfully',
            zOkText: 'OK'
          });
        }
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: 'Failed to update profile',
          zOkText: 'OK'
        });
      }
    });
  }

  // --- Formatting helpers ---

  formatDate(dateStr: string | null): string {
    return this.displayService.formatDate(dateStr);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  }

  calculateAge(dob: string): number {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  calculateTenure(joinDate: string): string {
    const now = new Date();
    const start = new Date(joinDate);
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (now.getDate() < start.getDate() && months > 0) {
      months--;
    }
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} yr ${months} mo`;
  }

  // --- Document methods ---

  loadDocuments(): void {
    this.loadingDocuments.set(true);
    this.personalService.getMyDocuments({
      search: this.docSearch || undefined,
      sort: this.docSort,
      order: this.docOrder
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.documents.set(response.data);
        }
        this.loadingDocuments.set(false);
      },
      error: () => {
        this.loadingDocuments.set(false);
      }
    });
  }

  onDocSearch(): void {
    this.loadDocuments();
  }

  onDocSort(field: string): void {
    if (this.docSort === field) {
      this.docOrder = this.docOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.docSort = field;
      this.docOrder = 'ASC';
    }
    this.loadDocuments();
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      employee_document: 'Employee',
      claim_receipt: 'Claim',
      leave_document: 'Leave',
      payslip: 'Payslip',
      company_document: 'Company',
      invoice: 'Invoice',
      other: 'Other'
    };
    return labels[category] || category;
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      employee_document: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      claim_receipt: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      leave_document: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      payslip: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      company_document: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
      invoice: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      other: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[category] || colors['other'];
  }

  getFileIconColor(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'text-pink-500';
    if (mimeType === 'application/pdf') return 'text-red-500';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'text-green-600';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'text-blue-600';
    return 'text-gray-500';
  }

  downloadDocument(doc: EmployeeDocument): void {
    this.downloadingDoc.set(doc.id);
    this.personalService.downloadDocument(doc.id).subscribe({
      next: (blob: Blob) => {
        this.personalService.downloadFile(blob, doc.original_filename);
        this.downloadingDoc.set(null);
      },
      error: () => {
        this.downloadingDoc.set(null);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: 'Failed to download document',
          zOkText: 'OK'
        });
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'file-text';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'file-spreadsheet';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'file-text';
    return 'file';
  }
}
