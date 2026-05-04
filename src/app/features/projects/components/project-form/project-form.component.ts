import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectStatus } from '../../models/project.model';
import { FileService } from '@/core/services/file.service';
import { API_CONFIG } from '@/core/config/api.config';

type ProjectSource = 'manual' | 'po';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-form.component.html'
})
export class ProjectFormComponent implements OnInit {
  private projectService = inject(ProjectService);
  private fileService = inject(FileService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  saving = signal(false);
  uploadingPo = signal(false);
  isEdit = signal(false);
  publicId = signal<string | null>(null);
  source = signal<ProjectSource>('manual');

  form: Partial<Project> = {
    code: '',
    name: '',
    description: '',
    client_name: '',
    status: 'Planning',
    start_date: '',
    end_date: '',
    budget: null,
    currency: 'MYR',
    po_number: '',
    po_date: '',
    po_value: null,
    po_currency: 'MYR',
    po_duration_months: null,
    po_document_url: '',
    notes: ''
  };

  statuses: { value: ProjectStatus; label: string }[] = [
    { value: 'Planning', label: 'Planning' },
    { value: 'Active', label: 'Active' },
    { value: 'On_Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const queryFromPo = this.route.snapshot.queryParamMap.get('source') === 'po';
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.publicId.set(id);
      this.loadProject(id);
    } else if (queryFromPo) {
      this.source.set('po');
    }
  }

  loadProject(id: string) {
    this.loading.set(true);
    this.projectService.get(id).subscribe({
      next: res => {
        const p = res.data;
        this.form = {
          code: p.code,
          name: p.name,
          description: p.description || '',
          client_name: p.client_name || '',
          status: p.status,
          start_date: p.start_date || '',
          end_date: p.end_date || '',
          budget: p.budget,
          currency: p.currency,
          po_number: p.po_number || '',
          po_date: p.po_date || '',
          po_value: p.po_value ?? null,
          po_currency: p.po_currency || p.currency || 'MYR',
          po_duration_months: p.po_duration_months ?? null,
          po_document_url: p.po_document_url || '',
          notes: p.notes || ''
        };
        if (p.po_number || p.po_value) this.source.set('po');
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setSource(s: ProjectSource) {
    this.source.set(s);
    if (s === 'manual') {
      this.form.po_number = '';
      this.form.po_date = '';
      this.form.po_value = null;
      this.form.po_duration_months = null;
      this.form.po_document_url = '';
    } else {
      // Default PO currency to project currency if not set
      this.form.po_currency = this.form.po_currency || this.form.currency || 'MYR';
    }
  }

  poFileName = signal<string>('');

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
          this.form.po_document_url = `${API_CONFIG.apiUrl}/files/${data.id}/preview`;
        }
        this.poFileName.set(file.name);
        this.uploadingPo.set(false);
      },
      error: () => this.uploadingPo.set(false)
    });
  }

  syncPoToBudget() {
    if (this.source() === 'po' && this.form.po_value != null && (this.form.budget == null || this.form.budget === '')) {
      this.form.budget = this.form.po_value;
    }
    if (this.form.po_currency && !this.form.currency) {
      this.form.currency = this.form.po_currency;
    }
  }

  save() {
    if (!this.form.code || !this.form.name) return;
    if (this.source() === 'po' && !this.form.po_number) return;

    this.syncPoToBudget();
    this.saving.set(true);

    const payload: any = { ...this.form };
    if (!payload.start_date) delete payload.start_date;
    if (!payload.end_date) delete payload.end_date;
    if (payload.budget === '' || payload.budget === null) delete payload.budget;

    if (this.source() === 'manual') {
      delete payload.po_number;
      delete payload.po_date;
      delete payload.po_value;
      delete payload.po_currency;
      delete payload.po_duration_months;
      delete payload.po_document_url;
    } else {
      if (!payload.po_date) delete payload.po_date;
      if (payload.po_value === '' || payload.po_value == null) delete payload.po_value;
      if (payload.po_duration_months === '' || payload.po_duration_months == null) delete payload.po_duration_months;
      if (!payload.po_document_url) delete payload.po_document_url;
    }

    const req = this.isEdit() && this.publicId()
      ? this.projectService.update(this.publicId()!, payload)
      : this.projectService.create(payload);

    req.subscribe({
      next: res => {
        this.saving.set(false);
        const id = this.isEdit() ? this.publicId() : res.data.public_id;
        this.router.navigate(['/projects', id]);
      },
      error: () => this.saving.set(false)
    });
  }

  cancel() {
    if (this.isEdit() && this.publicId()) {
      this.router.navigate(['/projects', this.publicId()]);
    } else {
      this.router.navigate(['/projects']);
    }
  }
}
