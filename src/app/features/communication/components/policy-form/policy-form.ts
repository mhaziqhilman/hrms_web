import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { PolicyService } from '../../services/policy.service';
import { PolicyFormData } from '../../models/policy.model';

@Component({
  selector: 'app-policy-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, QuillModule],
  templateUrl: './policy-form.html',
  styleUrl: './policy-form.css',
})
export class PolicyFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = signal(false);
  policyId: number | null = null;
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  // Quill editor configuration
  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  // Options for dropdowns
  categories = ['HR', 'IT', 'Finance', 'Safety', 'Compliance', 'Operations', 'Other'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private policyService: PolicyService
  ) {
    this.form = this.fb.group({
      policy_code: ['', [Validators.required, Validators.maxLength(50)]],
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.maxLength(500)],
      content: ['', Validators.required],
      category: ['HR', Validators.required],
      version: ['1.0', [Validators.required, Validators.maxLength(20)]],
      effective_from: [null],
      review_date: [null],
      expires_at: [null],
      requires_acknowledgment: [true],
      parent_policy_id: [null]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.policyId = Number(id);
      this.loadPolicy(this.policyId);
    }
  }

  loadPolicy(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.policyService.getPolicyById(id).subscribe({
      next: (response) => {
        if (response.success) {
          const policy = response.data;
          this.form.patchValue({
            policy_code: policy.policy_code,
            title: policy.title,
            description: policy.description || '',
            content: policy.content,
            category: policy.category,
            version: policy.version,
            effective_from: policy.effective_from ? policy.effective_from.substring(0, 10) : null,
            review_date: policy.review_date ? policy.review_date.substring(0, 10) : null,
            expires_at: policy.expires_at ? policy.expires_at.substring(0, 10) : null,
            requires_acknowledgment: policy.requires_acknowledgment,
            parent_policy_id: policy.parent_policy_id
          });
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load policy. Please try again.');
        this.loading.set(false);
        console.error('Error loading policy:', err);
      }
    });
  }

  saveAsDraft(): void {
    this.submitForm('Draft');
  }

  activate(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      alert('Please fill all required fields');
      return;
    }
    this.submitForm('Active');
  }

  private submitForm(status: 'Draft' | 'Active'): void {
    this.saving.set(true);
    this.error.set(null);

    const formData: PolicyFormData = {
      ...this.form.value,
      status
    };

    const operation = this.isEditMode()
      ? this.policyService.updatePolicy(this.policyId!, formData)
      : this.policyService.createPolicy(formData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          const action = this.isEditMode() ? 'updated' : 'created';
          alert(`Policy ${action} successfully!`);
          this.router.navigate(['/communication/policies']);
        }
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(`Failed to ${this.isEditMode() ? 'update' : 'create'} policy. Please try again.`);
        this.saving.set(false);
        console.error('Error saving policy:', err);
      }
    });
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/communication/policies']);
    }
  }

  // Helper method to mark all fields as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.hasError('required')) {
      return 'This field is required';
    }
    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `Maximum length is ${maxLength} characters`;
    }
    return '';
  }

  createNewVersion(): void {
    if (!this.isEditMode()) return;

    const confirmed = confirm('Create a new version of this policy? This will create a new policy linked to the current one.');
    if (!confirmed) return;

    const currentValues = this.form.value;
    const currentVersion = parseFloat(currentValues.version);
    const newVersion = (currentVersion + 0.1).toFixed(1);

    this.router.navigate(['/communication/policies/new'], {
      state: {
        parentPolicyId: this.policyId,
        inheritedData: {
          ...currentValues,
          version: newVersion,
          parent_policy_id: this.policyId,
          status: 'Draft'
        }
      }
    });
  }
}
