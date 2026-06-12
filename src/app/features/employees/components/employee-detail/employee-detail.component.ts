import { Component, OnInit, signal, computed, inject, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { Employee, EmployeeYTD } from '../../models/employee.model';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ChangeStatusDialogComponent } from '../change-status-dialog/change-status-dialog.component';
import { FileUpload } from '../../../../shared/components/file-upload/file-upload';
import { FileList as FileListComponent } from '../../../../shared/components/file-list/file-list';
import { FileService, FileUploadMetadata } from '../../../../core/services/file.service';
import { DisplayService } from '@/core/services/display.service';

// ZardUI Components
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';

export type TabId = 'personal' | 'contract' | 'payroll' | 'document' | 'statutory' | 'banking';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FileUpload,
    FileListComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardDividerComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardMenuImports,
    ZardTooltipModule,
    ZardSkeletonComponent
  ],
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.css']
})
export class EmployeeDetailComponent implements OnInit {
  employee = signal<Employee | null>(null);
  ytdData = signal<EmployeeYTD | null>(null);
  loading = signal<boolean>(false);
  loadingYTD = signal<boolean>(false);
  error = signal<string | null>(null);
  employeeId = signal<string | null>(null);

  // Tab management
  activeTab = signal<TabId>('personal');
  tabs: { id: TabId; label: string }[] = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'contract', label: 'Contract' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'document', label: 'Document' },
    { id: 'statutory', label: 'Statutory' },
    { id: 'banking', label: 'Banking' },
  ];

  // Computed: profile initials for avatar fallback
  initials = computed(() => {
    const name = this.employee()?.full_name;
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  });

  // Employee navigation
  employeeIds = signal<string[]>([]);
  currentIndex = signal<number>(-1);
  totalEmployees = signal<number>(0);

  // YTD
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];

  private displayService = inject(DisplayService);
  private dialogService = inject(ZardDialogService);
  private alertDialogService = inject(ZardAlertDialogService);
  private viewContainerRef = inject(ViewContainerRef);

  // Document management
  showDocumentUpload = signal<boolean>(false);
  documentFiles = signal<File[]>([]);
  fileUploadMetadata: FileUploadMetadata = {
    category: 'employee_document',
    sub_category: 'general',
    description: 'Document for employee'
  };
  uploadSuccess = signal<string | null>(null);

  // Flexible WFH toggle
  savingWfhFlexible = signal<boolean>(false);

  constructor(
    private employeeService: EmployeeService,
    private fileService: FileService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.availableYears.push(currentYear - i);
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeId.set(id);
      this.loadEmployee(id);
      this.loadYTD(id, this.selectedYear);
      this.initializeFileUploadMetadata(id);
      this.loadEmployeeNav();
    }
  }

  // --- Data loading ---

  loadEmployee(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.employee.set(response.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load employee');
        this.loading.set(false);
      }
    });
  }

  loadEmployeeNav(): void {
    this.employeeService.getEmployees({ limit: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const ids = response.data.employees.map(e => e.public_id || String(e.id));
          this.employeeIds.set(ids);
          this.totalEmployees.set(response.data.pagination.total);
          const idx = ids.indexOf(this.employeeId()!);
          this.currentIndex.set(idx >= 0 ? idx : 0);
        }
      },
      error: () => {}
    });
  }

  loadYTD(id: string, year: number): void {
    this.loadingYTD.set(true);
    this.employeeService.getEmployeeYTD(id, year).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ytdData.set(response.data);
        }
        this.loadingYTD.set(false);
      },
      error: () => {
        this.loadingYTD.set(false);
      }
    });
  }

  initializeFileUploadMetadata(employeeId: string): void {
    this.fileUploadMetadata = {
      category: 'employee_document',
      sub_category: 'general',
      related_to_employee_id: employeeId,
      description: `Document for employee #${employeeId}`
    };
  }

  // --- Tab management ---

  setActiveTab(tabId: TabId): void {
    this.activeTab.set(tabId);
  }

  selectTab(tabId: TabId): void {
    this.activeTab.set(tabId);
  }

  // --- Employee navigation ---

  navigateEmployee(direction: 'prev' | 'next'): void {
    const ids = this.employeeIds();
    const idx = this.currentIndex();
    const newIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (newIdx >= 0 && newIdx < ids.length) {
      const newId = ids[newIdx];
      this.loading.set(true);
      this.currentIndex.set(newIdx);
      this.employeeId.set(newId);
      this.activeTab.set('personal');
      this.loadEmployee(newId);
      this.loadYTD(newId, this.selectedYear);
      this.initializeFileUploadMetadata(newId);
      this.router.navigate(['/employees', newId], { replaceUrl: true });
    }
  }

  canNavigate(direction: 'prev' | 'next'): boolean {
    const idx = this.currentIndex();
    const total = this.employeeIds().length;
    return direction === 'prev' ? idx > 0 : idx < total - 1;
  }

  // --- Actions ---

  onEdit(): void {
    if (this.employeeId()) {
      this.router.navigate(['/employees', this.employeeId(), 'edit']);
    }
  }

  onBack(): void {
    this.router.navigate(['/employees']);
  }

  openChangeStatusDialog(): void {
    const emp = this.employee();
    const id = this.employeeId();
    if (!emp || !id) return;

    this.dialogService.create({
      zTitle: 'Change Employment Status',
      zContent: ChangeStatusDialogComponent,
      zViewContainerRef: this.viewContainerRef,
      zData: { employee: emp },
      zMaskClosable: false,
      zOkText: 'Save',
      zCancelText: 'Cancel',
      zOnOk: (instance: ChangeStatusDialogComponent): false | void => {
        if (!instance.isValid()) {
          return false;
        }
        const { employment_status, end_date, reason } = instance.getData();
        this.employeeService.setEmploymentStatus(id, employment_status, end_date, reason).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              // Preserve the signed photo_url already resolved on the loaded record.
              this.employee.set({ ...emp, ...response.data, photo_url: emp.photo_url });
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: err?.message || 'Failed to update employment status',
              zOkText: 'OK'
            });
          }
        });
      }
    });
  }

  sendEmail(): void {
    const emp = this.employee();
    if (emp?.email) {
      window.open(`mailto:${emp.email}`, '_self');
    }
  }

  toggleWfhFlexible(): void {
    const emp = this.employee();
    const id = this.employeeId();
    if (!emp || !id || this.savingWfhFlexible()) return;

    const next = !emp.wfh_flexible;
    // Optimistic update.
    this.employee.set({ ...emp, wfh_flexible: next });
    this.savingWfhFlexible.set(true);

    this.employeeService.setWfhFlexible(id, next).subscribe({
      next: () => {
        this.savingWfhFlexible.set(false);
      },
      error: (err) => {
        // Revert on failure.
        this.employee.set({ ...emp, wfh_flexible: !next });
        this.savingWfhFlexible.set(false);
        this.error.set(err?.message || 'Failed to update flexible WFH permission.');
      },
    });
  }

  onYearChange(year: number): void {
    this.selectedYear = year;
    if (this.employeeId()) {
      this.loadYTD(this.employeeId()!, year);
    }
  }

  // --- Formatting helpers ---

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return this.displayService.formatDate(dateString);
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

  // --- Document management ---

  toggleDocumentUpload(): void {
    this.showDocumentUpload.set(!this.showDocumentUpload());
    this.uploadSuccess.set(null);
  }

  onDocumentFilesSelected(files: File[]): void {
    this.documentFiles.set(files);
  }

  onDocumentUploadComplete(response: any): void {
    this.uploadSuccess.set('Documents uploaded successfully!');
    this.documentFiles.set([]);
    this.showDocumentUpload.set(false);
    setTimeout(() => this.uploadSuccess.set(null), 3000);
  }

  onDocumentUploadError(error: any): void {
    this.error.set(error.error?.message || 'Document upload failed');
  }
}
