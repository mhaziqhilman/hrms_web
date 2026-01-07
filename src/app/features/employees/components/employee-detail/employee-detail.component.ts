import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { Employee, EmployeeYTD } from '../../models/employee.model';
import { FileUpload } from '../../../../shared/components/file-upload/file-upload';
import { FileList as FileListComponent } from '../../../../shared/components/file-list/file-list';
import { FileService, FileUploadMetadata } from '../../../../core/services/file.service';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FileUpload,
    FileListComponent,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardDividerComponent,
    ZardSelectComponent,
    ZardSelectItemComponent
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
  employeeId = signal<number | null>(null);

  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];

  // Document management
  showDocumentUpload = signal<boolean>(false);
  documentFiles = signal<File[]>([]);
  fileUploadMetadata: FileUploadMetadata = {
    category: 'employee_document',
    sub_category: 'general',
    description: 'Document for employee'
  };
  uploadSuccess = signal<string | null>(null);

  constructor(
    private employeeService: EmployeeService,
    private fileService: FileService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Generate years for YTD dropdown (current year and previous 4 years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.availableYears.push(currentYear - i);
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeId.set(Number(id));
      this.loadEmployee(Number(id));
      this.loadYTD(Number(id), this.selectedYear);
      this.initializeFileUploadMetadata(Number(id));
    }
  }

  initializeFileUploadMetadata(employeeId: number): void {
    this.fileUploadMetadata = {
      category: 'employee_document',
      sub_category: 'general',
      related_to_employee_id: employeeId,
      description: `Document for employee #${employeeId}`
    };
  }

  loadEmployee(id: number): void {
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

  loadYTD(id: number, year: number): void {
    this.loadingYTD.set(true);

    this.employeeService.getEmployeeYTD(id, year).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ytdData.set(response.data);
        }
        this.loadingYTD.set(false);
      },
      error: (err) => {
        console.error('Failed to load YTD data:', err);
        this.loadingYTD.set(false);
      }
    });
  }

  onYearChange(year: number): void {
    this.selectedYear = year;
    if (this.employeeId()) {
      this.loadYTD(this.employeeId()!, year);
    }
  }

  onEdit(): void {
    if (this.employeeId()) {
      this.router.navigate(['/employees', this.employeeId(), 'edit']);
    }
  }

  onBack(): void {
    this.router.navigate(['/employees']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getMonthName(monthNumber: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || '';
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Active': 'badge-light-success',
      'Resigned': 'badge-light-warning',
      'Terminated': 'badge-light-danger'
    };
    return statusMap[status] || 'badge-light-secondary';
  }

  getEmploymentTypeBadgeClass(type: string): string {
    const typeMap: Record<string, string> = {
      'Permanent': 'badge-light-primary',
      'Contract': 'badge-light-info',
      'Probation': 'badge-light-warning',
      'Intern': 'badge-light-secondary'
    };
    return typeMap[type] || 'badge-light-secondary';
  }

  // Document management methods
  toggleDocumentUpload(): void {
    this.showDocumentUpload.set(!this.showDocumentUpload());
    this.uploadSuccess.set(null);
  }

  onDocumentFilesSelected(files: File[]): void {
    this.documentFiles.set(files);
  }

  onDocumentUploadComplete(response: any): void {
    console.log('Documents uploaded successfully:', response);
    this.uploadSuccess.set('Documents uploaded successfully!');
    this.documentFiles.set([]);
    this.showDocumentUpload.set(false);

    // Clear success message after 3 seconds
    setTimeout(() => {
      this.uploadSuccess.set(null);
    }, 3000);
  }

  onDocumentUploadError(error: any): void {
    this.error.set(error.error?.message || 'Document upload failed');
  }
}
