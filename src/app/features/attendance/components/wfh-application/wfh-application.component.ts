import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '@/core/services/auth.service';
import { WFHApplication } from '../../models/attendance.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-wfh-application',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardMenuImports,
    ZardDatePickerComponent
  ],
  templateUrl: './wfh-application.component.html',
  styleUrl: './wfh-application.component.css'
})
export class WfhApplicationComponent implements OnInit {
  wfhForm!: FormGroup;
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // WFH Applications List
  wfhApplications = signal<WFHApplication[]>([]);
  loadingApplications = signal(false);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  limit = 10;

  // Filter
  selectedStatus = signal<'Pending' | 'Approved' | 'Rejected' | ''>('');

  // Employee - from auth service
  employeeId = signal<number | null>(null);

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private router: Router
  ) {}

  isHRManager(): boolean {
    return this.authService.hasAnyRole(['admin', 'super_admin', 'manager']);
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();
    this.employeeId.set(user?.employee?.id ?? null);

    this.initializeForm();
    this.loadWFHApplications();
  }

  initializeForm(): void {
    this.wfhForm = this.fb.group({
      date: [null, [Validators.required]],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  loadWFHApplications(): void {
    if (!this.employeeId()) {
      console.warn('No employee ID set, skipping WFH applications load');
      return;
    }

    this.loadingApplications.set(true);
    this.error.set(null);

    const params: any = {
      employee_id: this.employeeId(),
      page: this.currentPage(),
      limit: this.limit
    };

    if (this.selectedStatus()) {
      params.status = this.selectedStatus();
    }

    console.log('=== WFH Applications Load Debug ===');
    console.log('1. Request params:', params);
    console.log('2. Auth token exists:', !!localStorage.getItem('hrms_token'));
    console.log('3. API URL:', `${this.attendanceService['apiUrl']}/wfh`);

    this.attendanceService.getWFHApplications(params).subscribe({
      next: (response: any) => {
        console.log('4. WFH API Success Response:', response);

        if (response && response.success) {
          // Handle both response structures
          let data: any[] = [];

          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data && typeof response.data === 'object') {
            // Check for nested structure - backend returns wfh_applications (with underscore)
            if (response.data.wfh_applications && Array.isArray(response.data.wfh_applications)) {
              data = response.data.wfh_applications;
            } else if (response.data.wfhApplications && Array.isArray(response.data.wfhApplications)) {
              data = response.data.wfhApplications;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              data = response.data.data;
            }
          }

          console.log('5. Parsed WFH applications data:', data);
          this.wfhApplications.set(data);

          // Safely access pagination - check both locations
          const paginationObj = response.pagination || response.data?.pagination;

          if (paginationObj) {
            this.totalPages.set(paginationObj.totalPages || 1);
          } else {
            this.totalPages.set(1);
          }
        } else {
          console.warn('WFH API response success is false or response is invalid');
          this.wfhApplications.set([]);
          this.totalPages.set(1);
        }

        this.loadingApplications.set(false);
      },
      error: (err) => {
        console.error('=== WFH API Error ===');
        console.error('Status:', err.status);
        console.error('Status Text:', err.statusText);
        console.error('Error object:', err);
        console.error('Error response:', err.error);
        console.error('Full error details:', JSON.stringify({
          status: err.status,
          statusText: err.statusText,
          message: err.error?.message || err.message,
          errors: err.error?.errors,
          url: err.url
        }, null, 2));

        // Display detailed error message
        let errorMessage = 'Failed to load WFH applications';

        if (err.status === 400) {
          errorMessage = 'Bad Request: ';
          if (err.error?.errors && Array.isArray(err.error.errors)) {
            errorMessage += err.error.errors.map((e: any) => e.msg || e.message).join(', ');
          } else if (err.error?.message) {
            errorMessage += err.error.message;
          } else {
            errorMessage += 'Invalid request parameters';
          }
        } else if (err.status === 401) {
          errorMessage = 'Unauthorized: Please log in again';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        this.error.set(errorMessage);
        this.wfhApplications.set([]);
        this.loadingApplications.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.wfhForm.invalid) {
      this.markFormGroupTouched(this.wfhForm);
      return;
    }

    if (!this.employeeId()) {
      this.error.set('Employee ID not found. Please log in again.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    const formData = this.wfhForm.value;
    const dateVal: Date = formData.date;
    const dateStr = `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}-${String(dateVal.getDate()).padStart(2, '0')}`;
    const request = {
      employee_id: this.employeeId()!,
      date: dateStr,
      reason: formData.reason
    };

    this.attendanceService.submitWFHApplication(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.success.set('WFH application submitted successfully!');
          this.wfhForm.reset();
          this.loadWFHApplications();

          // Clear success message after 3 seconds
          setTimeout(() => this.success.set(null), 3000);
        }
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to submit WFH application');
        this.submitting.set(false);
        console.error('WFH application error:', err);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadWFHApplications();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadWFHApplications();
    }
  }

  cancelApplication(id: number): void {
    if (!confirm('Are you sure you want to cancel this WFH application?')) {
      return;
    }

    this.attendanceService.cancelWFHApplication(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.success.set('WFH application cancelled successfully');
          this.loadWFHApplications();

          setTimeout(() => this.success.set(null), 3000);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to cancel WFH application');
        console.error('Error cancelling WFH application:', err);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'badge-warning';
      case 'Approved':
        return 'badge-success';
      case 'Rejected':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return '--';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isPastDate(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  canCancelApplication(application: WFHApplication): boolean {
    return application.status === 'Pending' && !this.isPastDate(application.date);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.wfhForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.wfhForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  getMinDate(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  getMaxDate(): Date {
    // Allow WFH applications up to 30 days in advance
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    maxDate.setHours(0, 0, 0, 0);
    return maxDate;
  }
}
