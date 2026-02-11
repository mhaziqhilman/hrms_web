import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CompanyService } from '../../../../core/services/company.service';
import { CompanySetupRequest } from '../../../../core/models/auth.models';

import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';

@Component({
  selector: 'app-company-setup-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardInputDirective,
    ZardFormLabelComponent,
    ZardIconComponent,
    ZardDividerComponent
  ],
  templateUrl: './company-setup-wizard.component.html'
})
export class CompanySetupWizardComponent {
  currentStep = 1;
  totalSteps = 3;
  loading = false;
  errorMessage = '';

  companyForm: FormGroup;
  employeeForm: FormGroup;
  invitationForm: FormGroup;

  industries = [
    'Technology', 'Finance & Banking', 'Healthcare', 'Education',
    'Manufacturing', 'Retail & E-Commerce', 'Construction',
    'Food & Beverage', 'Logistics & Transportation', 'Consulting',
    'Real Estate', 'Media & Entertainment', 'Agriculture', 'Other'
  ];

  companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' }
  ];

  roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'staff', label: 'Staff' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private companyService: CompanyService
  ) {
    this.companyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      registration_no: [''],
      description: [''],
      industry: [''],
      size: [''],
      country: ['Malaysia'],
      address: [''],
      phone: [''],
      website: ['']
    });

    this.employeeForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      employee_id: ['EMP001', [Validators.required]],
      gender: ['', [Validators.required]],
      position: [''],
      department: [''],
      join_date: [new Date().toISOString().split('T')[0], [Validators.required]],
      basic_salary: [0, [Validators.required, Validators.min(0)]],
      email: [''],
      mobile: ['']
    });

    this.invitationForm = this.fb.group({
      invitations: this.fb.array([])
    });

    // Pre-fill email from current user
    const user = this.authService.getCurrentUserValue();
    if (user) {
      this.employeeForm.patchValue({ email: user.email });
    }
  }

  get invitations(): FormArray {
    return this.invitationForm.get('invitations') as FormArray;
  }

  get stepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Company Information';
      case 2: return 'Initial Employee';
      case 3: return 'Invite Users';
      default: return '';
    }
  }

  get stepSubtitle(): string {
    switch (this.currentStep) {
      case 1: return 'Basic information about your company';
      case 2: return 'Set up your employee profile';
      case 3: return 'Invite team members to join (optional)';
      default: return '';
    }
  }

  addInvitation(): void {
    this.invitations.push(this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: ['staff']
    }));
  }

  removeInvitation(index: number): void {
    this.invitations.removeAt(index);
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.companyForm.invalid) {
      this.markFormTouched(this.companyForm);
      return;
    }
    if (this.currentStep === 2 && this.employeeForm.invalid) {
      this.markFormTouched(this.employeeForm);
      return;
    }
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  private markFormTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }

  completeSetup(): void {
    this.loading = true;
    this.errorMessage = '';

    const payload: CompanySetupRequest = {
      company: this.companyForm.value,
      initialEmployee: this.employeeForm.value,
      invitations: this.invitations.length > 0 ? this.invitations.value : undefined
    };

    this.companyService.setupCompany(payload).subscribe({
      next: (response) => {
        this.loading = false;

        // Update auth session with new token and user data
        if (response.data?.token && response.data?.user) {
          this.authService.updateSession(response.data.token, response.data.user);
        }

        // Refresh auth service state and navigate
        this.authService.getCurrentUser().subscribe({
          next: () => {
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Failed to complete setup. Please try again.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/onboarding']);
  }
}
