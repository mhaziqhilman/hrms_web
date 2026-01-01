import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { MemoService } from '../../services/memo.service';
import { MemoFormData } from '../../models/memo.model';

// ZardUI Component Imports
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardFormMessageComponent } from '@/shared/components/form/form-message.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';

@Component({
  selector: 'app-memo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    QuillModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardCardComponent,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardFormMessageComponent,
    ZardInputDirective,
    ZardSelectComponent,
    ZardSelectItemComponent
  ],
  templateUrl: './memo-form.html',
  styleUrl: './memo-form.css',
})
export class MemoFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = signal(false);
  memoId: number | null = null;
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
  priorities = ['Low', 'Normal', 'High', 'Urgent'];
  targetAudiences = ['All', 'Department', 'Position', 'Specific'];

  // Placeholder data - in real app, these would come from API
  departments = ['HR', 'IT', 'Finance', 'Operations', 'Sales', 'Marketing'];
  positions = ['Manager', 'Developer', 'Designer', 'Analyst', 'Coordinator'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private memoService: MemoService
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', Validators.required],
      summary: ['', Validators.maxLength(500)],
      priority: ['Normal', Validators.required],
      target_audience: ['All', Validators.required],
      target_departments: [[]],
      target_positions: [[]],
      target_employee_ids: [[]],
      requires_acknowledgment: [false],
      expires_at: [null]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.memoId = Number(id);
      this.loadMemo(this.memoId);
    }

    // Watch target_audience changes to reset target fields
    this.form.get('target_audience')?.valueChanges.subscribe(value => {
      if (value === 'All') {
        this.form.patchValue({
          target_departments: [],
          target_positions: [],
          target_employee_ids: []
        });
      }
    });
  }

  loadMemo(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.memoService.getMemoById(id).subscribe({
      next: (response) => {
        if (response.success) {
          const memo = response.data;
          this.form.patchValue({
            title: memo.title,
            content: memo.content,
            summary: memo.summary || '',
            priority: memo.priority,
            target_audience: memo.target_audience,
            target_departments: memo.target_departments || [],
            target_positions: memo.target_positions || [],
            target_employee_ids: memo.target_employee_ids || [],
            requires_acknowledgment: memo.requires_acknowledgment,
            expires_at: memo.expires_at ? memo.expires_at.substring(0, 16) : null
          });
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load memo. Please try again.');
        this.loading.set(false);
        console.error('Error loading memo:', err);
      }
    });
  }

  saveAsDraft(): void {
    this.submitForm('Draft');
  }

  publish(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      alert('Please fill all required fields');
      return;
    }
    this.submitForm('Published');
  }

  private submitForm(status: 'Draft' | 'Published'): void {
    this.saving.set(true);
    this.error.set(null);

    const formData: MemoFormData = {
      ...this.form.value,
      status,
      published_at: status === 'Published' ? new Date().toISOString() : undefined
    };

    // Clean up target fields based on target_audience
    if (formData.target_audience === 'All') {
      formData.target_departments = [];
      formData.target_positions = [];
      formData.target_employee_ids = [];
    } else if (formData.target_audience === 'Department') {
      formData.target_positions = [];
      formData.target_employee_ids = [];
    } else if (formData.target_audience === 'Position') {
      formData.target_departments = [];
      formData.target_employee_ids = [];
    } else if (formData.target_audience === 'Specific') {
      formData.target_departments = [];
      formData.target_positions = [];
    }

    const operation = this.isEditMode()
      ? this.memoService.updateMemo(this.memoId!, formData)
      : this.memoService.createMemo(formData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          const action = this.isEditMode() ? 'updated' : 'created';
          alert(`Memo ${action} successfully!`);
          this.router.navigate(['/dashboard/communication/memos']);
        }
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(`Failed to ${this.isEditMode() ? 'update' : 'create'} memo. Please try again.`);
        this.saving.set(false);
        console.error('Error saving memo:', err);
      }
    });
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/dashboard/communication/memos']);
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

  // Checkbox handlers for multi-select
  toggleDepartment(dept: string): void {
    const departments = this.form.get('target_departments')?.value || [];
    const index = departments.indexOf(dept);
    if (index > -1) {
      departments.splice(index, 1);
    } else {
      departments.push(dept);
    }
    this.form.patchValue({ target_departments: [...departments] });
  }

  isDepartmentSelected(dept: string): boolean {
    const departments = this.form.get('target_departments')?.value || [];
    return departments.includes(dept);
  }

  togglePosition(pos: string): void {
    const positions = this.form.get('target_positions')?.value || [];
    const index = positions.indexOf(pos);
    if (index > -1) {
      positions.splice(index, 1);
    } else {
      positions.push(pos);
    }
    this.form.patchValue({ target_positions: [...positions] });
  }

  isPositionSelected(pos: string): boolean {
    const positions = this.form.get('target_positions')?.value || [];
    return positions.includes(pos);
  }
}
