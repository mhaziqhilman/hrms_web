import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { PolicyService } from '../../services/policy.service';
import { PolicyFormData } from '../../models/policy.model';

// ZardUI
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardFormControlComponent } from '@/shared/components/form/form-control.component';
import { ZardFormMessageComponent } from '@/shared/components/form/form-message.component';
import { ZardTooltipDirective } from '@/shared/components/tooltip/tooltip';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

@Component({
  selector: 'app-policy-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    QuillModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardCheckboxComponent,
    ZardDatePickerComponent,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardFormControlComponent,
    ZardFormMessageComponent,
    ZardTooltipDirective
  ],
  templateUrl: './policy-form.html',
  styleUrl: './policy-form.css',
})
export class PolicyFormComponent implements OnInit {
  private alertDialogService = inject(ZardAlertDialogService);
  form: FormGroup;
  isEditMode = signal(false);
  policyId: string | null = null;
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  quillConfig = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  categories = ['HR', 'IT', 'Finance', 'Safety', 'Compliance', 'Operations', 'Other'];

  // Field-control getters for clean template error checks
  get codeControl() { return this.form.get('policy_code'); }
  get titleControl() { return this.form.get('title'); }
  get versionControl() { return this.form.get('version'); }
  get descriptionControl() { return this.form.get('description'); }
  get contentControl() { return this.form.get('content'); }

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
      this.policyId = id;
      this.loadPolicy(this.policyId);
    }
  }

  loadPolicy(id: string): void {
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
      return;
    }
    this.submitForm('Active');
  }

  private submitForm(status: 'Draft' | 'Active'): void {
    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.value;

    // Build a clean payload: convert Date → YYYY-MM-DD and omit null/empty
    // optional fields so the backend validator doesn't reject them.
    const formData: PolicyFormData = {
      policy_code: raw.policy_code,
      title: raw.title,
      content: raw.content,
      category: raw.category,
      version: raw.version,
      requires_acknowledgment: !!raw.requires_acknowledgment,
      status
    };

    if (raw.description) formData.description = raw.description;
    if (raw.effective_from) formData.effective_from = this.toDateString(raw.effective_from);
    if (raw.review_date) formData.review_date = this.toDateString(raw.review_date);
    if (raw.expires_at) formData.expires_at = this.toDateString(raw.expires_at);
    if (raw.parent_policy_id != null) formData.parent_policy_id = raw.parent_policy_id;

    const operation = this.isEditMode()
      ? this.policyService.updatePolicy(this.policyId!, formData)
      : this.policyService.createPolicy(formData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
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
    if (!this.form.dirty) {
      this.router.navigate(['/communication/policies']);
      return;
    }
    this.alertDialogService.confirm({
      zTitle: 'Discard Changes',
      zDescription: 'You have unsaved changes. Are you sure you want to leave?',
      zOkText: 'Discard',
      zCancelText: 'Stay',
      zOkDestructive: true,
      zOnOk: () => {
        this.router.navigate(['/communication/policies']);
      }
    });
  }

  /** Normalize Date | string → 'YYYY-MM-DD' so backend date validators accept it. */
  private toDateString(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  createNewVersion(): void {
    if (!this.isEditMode()) return;

    this.alertDialogService.confirm({
      zTitle: 'Create New Version',
      zDescription: 'Create a new version of this policy? This will create a new policy linked to the current one.',
      zOkText: 'Create Version',
      zCancelText: 'Cancel',
      zOnOk: () => {
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
    });
  }
}
