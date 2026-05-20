import {
  Component,
  OnInit,
  AfterViewInit,
  signal,
  computed,
  inject,
  ViewChild,
  ElementRef
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MemoService } from '../../services/memo.service';
import { AnnouncementCategoryService } from '../../services/announcement-category.service';
import { MemoFormData, AnnouncementCategory } from '../../models/memo.model';
import { AuthService } from '@/core/services/auth.service';
import { EmployeeService } from '@/features/employees/services/employee.service';

// ZardUI Component Imports
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardDateTimePickerComponent } from '@/shared/components/date-time-picker/date-time-picker.component';
import { ZardSheetImports } from '@/shared/components/sheet/sheet.component';

interface MemoAttachment {
  id: string;
  name: string;
  size: number;
  mime: string;
  dataUrl: string;
}

interface AudienceEmployee {
  id: number;
  full_name: string;
  employee_id: string;
  position: string;
  department: string;
  photo_url?: string;
}

const ATTACHMENT_BLOCK_MARKER = 'data-memo-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Component({
  selector: 'app-memo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    ZardIconComponent,
    ZardButtonComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardDateTimePickerComponent,
    ZardSheetImports,
    ...ZardMenuImports
  ],
  templateUrl: './memo-form.html',
  styleUrl: './memo-form.css',
})
export class MemoFormComponent implements OnInit, AfterViewInit {
  private alertDialogService = inject(ZardAlertDialogService);
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);

  @ViewChild('bodyEditor') bodyEditor?: ElementRef<HTMLDivElement>;

  form: FormGroup;
  isEditMode = signal(false);
  memoId: string | null = null;
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  previewMode = signal(false);
  attachments = signal<MemoAttachment[]>([]);
  lastSavedAt = signal<Date | null>(null);
  scheduleMode = signal(false);
  scheduledAt = signal<string>('');

  // Start of today — used as the minimum selectable date for the pickers
  today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

  // Real company headcount, loaded from the API
  companyEmployeeCount = signal<number>(0);
  departmentCounts = signal<Record<string, number>>({});
  departments = signal<string[]>([]);

  // Audience targeting data (loaded from the API)
  allEmployees = signal<AudienceEmployee[]>([]);
  positions = signal<string[]>([]);
  employeeSearch = signal('');

  // Options for dropdowns
  priorities: Array<'Low' | 'Normal' | 'High' | 'Urgent'> = ['Low', 'Normal', 'High', 'Urgent'];
  targetAudiences: Array<'All' | 'Department' | 'Position' | 'Specific'> = ['All', 'Department', 'Position', 'Specific'];
  categories = signal<AnnouncementCategory[]>([]);

  // Employees filtered by the "Specific people" search box
  filteredEmployees = computed<AudienceEmployee[]>(() => {
    const q = this.employeeSearch().trim().toLowerCase();
    const list = this.allEmployees();
    if (!q) return list;
    return list.filter(e =>
      e.full_name.toLowerCase().includes(q) ||
      e.employee_id.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  });

  // Ticks whenever the reactive form changes so plain-method getters below
  // stay in sync inside change detection.
  private formTick = signal(0);
  private bodyTick = signal(0);

  // Live body stats
  wordCount = computed(() => {
    this.bodyTick();
    const text = this.getEditorText();
    return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  });
  charCount = computed(() => {
    this.bodyTick();
    return this.getEditorText().length;
  });
  readMinutes = computed(() => Math.max(1, Math.ceil(this.wordCount() / 220)));

  sanitizedContent = computed<SafeHtml>(() => {
    this.bodyTick();
    return this.sanitizer.bypassSecurityTrustHtml(this.form?.get('content')?.value || '');
  });

  lastSavedLabel = computed(() => {
    const t = this.lastSavedAt();
    if (!t) return '';
    const diff = Math.floor((Date.now() - t.getTime()) / 1000);
    if (diff < 60) return `Draft · saved ${diff}s ago`;
    if (diff < 3600) return `Draft · saved ${Math.floor(diff / 60)}m ago`;
    return `Draft · saved ${t.toLocaleTimeString()}`;
  });

  // Author info for preview card
  authorName = computed(() => {
    const u = this.authService.currentUserSignal();
    return u?.employee?.full_name || u?.email || 'You';
  });
  authorRole = computed(() => {
    const u = this.authService.currentUserSignal();
    return u?.employee?.position || u?.role || 'Author';
  });
  authorInitials = computed(() => {
    const n = this.authorName();
    return n.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'U';
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private memoService: MemoService,
    private categoryService: AnnouncementCategoryService
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
      expires_at: [null],
      category_id: [null],
      is_pinned: [false]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadEmployeeStats();
    this.loadEmployees();

    // Keep method getters reactive to form value changes
    this.form.valueChanges.subscribe(() => this.formTick.update(n => n + 1));

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.memoId = id;
      this.loadMemo(this.memoId);
    }

    // Reset audience targets when audience changes
    this.form.get('target_audience')?.valueChanges.subscribe(value => {
      if (value === 'All') {
        this.form.patchValue({
          target_departments: [],
          target_positions: [],
          target_employee_ids: []
        }, { emitEvent: false });
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.syncEditorFromForm(), 0);
  }

  // ============== FORM-DERIVED LABELS (methods → always fresh) ==============
  categoryName(): string {
    const id = this.form?.get('category_id')?.value;
    if (!id) return '';
    return this.categories().find(c => c.id === id)?.name || '';
  }

  audienceLabel(): string {
    const a = this.form?.get('target_audience')?.value;
    if (a === 'All') {
      const n = this.companyEmployeeCount();
      return n > 0 ? `All employees · ${n}` : 'All employees';
    }
    if (a === 'Department') {
      const depts: string[] = this.form.get('target_departments')?.value || [];
      return depts.length ? `${depts.length} department${depts.length > 1 ? 's' : ''}` : 'Pick departments';
    }
    if (a === 'Position') {
      const pos: string[] = this.form.get('target_positions')?.value || [];
      return pos.length ? `${pos.length} position${pos.length > 1 ? 's' : ''}` : 'Pick positions';
    }
    const ids: number[] = this.form.get('target_employee_ids')?.value || [];
    return ids.length ? `${ids.length} ${ids.length > 1 ? 'people' : 'person'}` : 'Pick people';
  }

  audienceHeaderLabel(): string {
    const a = this.form?.get('target_audience')?.value;
    if (a === 'All') return 'All employees';
    if (a === 'Department') return 'By department';
    if (a === 'Position') return 'By position';
    return 'Specific people';
  }

  audienceCount(): string {
    const a = this.form?.get('target_audience')?.value;
    if (a === 'All') return `${this.companyEmployeeCount()}`;
    if (a === 'Department') {
      const depts: string[] = this.form.get('target_departments')?.value || [];
      const counts = this.departmentCounts();
      const sum = depts.reduce((acc, d) => acc + (counts[d] || 0), 0);
      return `${sum}`;
    }
    if (a === 'Position') {
      const pos: string[] = this.form.get('target_positions')?.value || [];
      const sum = pos.reduce((acc, p) => acc + this.positionCount(p), 0);
      return `${sum}`;
    }
    const ids: number[] = this.form.get('target_employee_ids')?.value || [];
    return `${ids.length}`;
  }

  departmentCount(dept: string): number {
    return this.departmentCounts()[dept] || 0;
  }

  positionCount(pos: string): number {
    return this.allEmployees().filter(e => e.position === pos).length;
  }

  expiresLabel(): string {
    const v = this.form?.get('expires_at')?.value;
    if (!v) return 'never';
    try {
      return new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'never';
    }
  }

  // ============== EDITOR ==============
  private syncEditorFromForm(): void {
    if (!this.bodyEditor) return;
    const html = this.form.get('content')?.value || '';
    if (this.bodyEditor.nativeElement.innerHTML !== html) {
      this.bodyEditor.nativeElement.innerHTML = html;
      this.bodyTick.update(n => n + 1);
    }
  }

  private getEditorText(): string {
    return this.bodyEditor?.nativeElement.innerText || '';
  }

  onBodyInput(): void {
    if (!this.bodyEditor) return;
    const html = this.bodyEditor.nativeElement.innerHTML;
    this.form.patchValue({ content: html }, { emitEvent: false });
    this.form.get('content')?.markAsDirty();
    this.bodyTick.update(n => n + 1);
  }

  exec(command: string, value?: string): void {
    this.bodyEditor?.nativeElement.focus();
    document.execCommand(command, false, value);
    this.onBodyInput();
  }

  insertLink(): void {
    const url = window.prompt('Enter URL:', 'https://');
    if (!url) return;
    this.exec('createLink', url);
  }

  onBodyPaste(e: ClipboardEvent): void {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) this.insertImageFromFile(file);
        return;
      }
    }
  }

  onBodyDrop(e: DragEvent): void {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    if (!files.length) return;
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        this.insertImageFromFile(file);
      } else {
        this.addAttachmentFile(file);
      }
    });
  }

  // ============== IMAGE INSERT ==============
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.insertImageFromFile(file);
  }

  private insertImageFromFile(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
      this.error.set(`Image too large (max 10MB). "${file.name}" is ${this.formatSize(file.size)}.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = `<img src="${dataUrl}" alt="${this.escapeAttr(file.name)}" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;" />`;
      this.bodyEditor?.nativeElement.focus();
      document.execCommand('insertHTML', false, img);
      this.onBodyInput();
      this.error.set(null);
    };
    reader.onerror = () => this.error.set(`Failed to read image "${file.name}".`);
    reader.readAsDataURL(file);
  }

  // ============== ATTACHMENTS ==============
  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    files.forEach(f => this.addAttachmentFile(f));
  }

  private addAttachmentFile(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
      this.error.set(`File too large (max 10MB). "${file.name}" is ${this.formatSize(file.size)}.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const att: MemoAttachment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        dataUrl: reader.result as string
      };
      this.attachments.update(list => [...list, att]);
      this.error.set(null);
    };
    reader.onerror = () => this.error.set(`Failed to read file "${file.name}".`);
    reader.readAsDataURL(file);
  }

  removeAttachment(id: string): void {
    this.attachments.update(list => list.filter(a => a.id !== id));
  }

  // ============== PREVIEW / SETTINGS ==============
  togglePreview(): void {
    // Sync the editor HTML into the form before opening the preview sheet so
    // it always reflects the latest content. The editor stays mounted, so
    // closing the sheet returns to it with content intact.
    if (!this.previewMode()) {
      this.onBodyInput();
    }
    this.previewMode.update(v => !v);
  }

  /** Keeps `previewMode` in sync when the sheet is dismissed via its X / backdrop. */
  onPreviewOpenChange(open: boolean): void {
    this.previewMode.set(open);
  }

  scrollToSetting(anchorId: string): void {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('memo-anchor-flash');
      setTimeout(() => el.classList.remove('memo-anchor-flash'), 1200);
    }
  }

  setPriority(p: 'Low' | 'Normal' | 'High' | 'Urgent'): void {
    this.form.patchValue({ priority: p });
  }

  setAudience(a: 'All' | 'Department' | 'Position' | 'Specific'): void {
    this.form.patchValue({ target_audience: a });
  }

  toggleSetting(field: 'is_pinned' | 'requires_acknowledgment'): void {
    this.form.patchValue({ [field]: !this.form.get(field)?.value });
  }

  setSchedule(on: boolean): void {
    this.scheduleMode.set(on);
    if (!on) this.scheduledAt.set('');
  }

  setScheduledAt(value: string): void {
    this.scheduledAt.set(value || '');
  }

  // ===== Date/time helpers for the ZardUI date-time picker =====
  // Internal values are kept as `YYYY-MM-DDTHH:mm` (datetime-local) strings.

  private toLocalDateTimeString(date: Date): string {
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${mo}-${d}T${h}:${mi}`;
  }

  private parseDateTime(value: string | null | undefined): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  // --- Schedule (publish date/time) ---
  getScheduleDateTime(): Date | null {
    return this.parseDateTime(this.scheduledAt());
  }

  onScheduleDateTime(date: Date | null): void {
    this.scheduledAt.set(date ? this.toLocalDateTimeString(date) : '');
  }

  // --- Expires ---
  getExpiresDateTime(): Date | null {
    return this.parseDateTime(this.form.get('expires_at')?.value);
  }

  onExpiresDateTime(date: Date | null): void {
    this.form.patchValue({ expires_at: date ? this.toLocalDateTimeString(date) : null });
  }

  // ============== LOAD / SAVE ==============
  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (res) => this.categories.set(res.data.categories),
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  loadEmployeeStats(): void {
    this.employeeService.getEmployeeStatistics().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const data = res.data as any;
          this.companyEmployeeCount.set(
            data.active ?? data.active_employees ?? data.total ?? data.total_employees ?? 0
          );

          // by_department arrives as a Sequelize GROUP BY array of { department, count }.
          // Normalise to a { [department]: count } map for the audience picker.
          const counts: Record<string, number> = {};
          const raw = data.by_department;
          if (Array.isArray(raw)) {
            for (const row of raw) {
              const name = (row?.department ?? '').toString().trim() || 'Unassigned';
              counts[name] = Number(row?.count) || 0;
            }
          } else if (raw && typeof raw === 'object') {
            // Tolerate a pre-mapped object shape too
            for (const [name, value] of Object.entries(raw)) {
              counts[name] = Number(value) || 0;
            }
          }

          this.departmentCounts.set(counts);
          const deptNames = Object.keys(counts);
          if (deptNames.length) this.departments.set(deptNames.sort());
        }
      },
      error: (err) => console.error('Error loading employee statistics:', err)
    });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees({ status: 'Active', limit: 500, sort: 'full_name', order: 'asc' }).subscribe({
      next: (res) => {
        if (res?.success && res.data?.employees) {
          const emps: AudienceEmployee[] = res.data.employees
            .filter(e => e.id != null)
            .map(e => ({
              id: e.id,
              full_name: e.full_name,
              employee_id: e.employee_id,
              position: e.position || 'Unassigned',
              department: e.department || 'Unassigned',
              photo_url: e.photo_url
            }));
          this.allEmployees.set(emps);

          // Derive the distinct position list + department fallback from real data
          const posSet = new Set<string>();
          const deptSet = new Set<string>();
          emps.forEach(e => {
            if (e.position) posSet.add(e.position);
            if (e.department) deptSet.add(e.department);
          });
          this.positions.set(Array.from(posSet).sort());
          if (!this.departments().length && deptSet.size) {
            this.departments.set(Array.from(deptSet).sort());
          }
        }
      },
      error: (err) => console.error('Error loading employees:', err)
    });
  }

  loadMemo(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.memoService.getMemoById(id).subscribe({
      next: (response) => {
        if (response.success) {
          const memo = response.data;
          const { strippedContent, parsedAttachments } = this.extractAttachments(memo.content || '');

          this.form.patchValue({
            title: memo.title,
            content: strippedContent,
            summary: memo.summary || '',
            priority: memo.priority,
            target_audience: memo.target_audience,
            target_departments: memo.target_departments || [],
            target_positions: memo.target_positions || [],
            target_employee_ids: memo.target_employee_ids || [],
            requires_acknowledgment: memo.requires_acknowledgment,
            expires_at: memo.expires_at ? memo.expires_at.substring(0, 16) : null,
            category_id: memo.category_id || null,
            is_pinned: memo.is_pinned || false
          });
          this.attachments.set(parsedAttachments);
          setTimeout(() => this.syncEditorFromForm(), 0);
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
    this.onBodyInput();
    this.submitForm('Draft');
  }

  publish(): void {
    this.onBodyInput();
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      this.error.set('Please fill in title and content before publishing.');
      return;
    }
    this.submitForm('Published');
  }

  private submitForm(status: 'Draft' | 'Published'): void {
    this.saving.set(true);
    this.error.set(null);

    const baseContent = this.form.value.content || '';
    const contentWithAttachments = this.composeContent(baseContent, this.attachments());

    const publishAt = (status === 'Published' && this.scheduleMode() && this.scheduledAt())
      ? new Date(this.scheduledAt()).toISOString()
      : (status === 'Published' ? new Date().toISOString() : undefined);

    const formData: MemoFormData = {
      ...this.form.value,
      content: contentWithAttachments,
      status,
      published_at: publishAt
    };

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
          this.lastSavedAt.set(new Date());
          this.saving.set(false);
          if (status === 'Published') {
            this.router.navigate(['/communication/memos']);
          } else {
            if (!this.isEditMode() && response.data?.public_id) {
              this.isEditMode.set(true);
              this.memoId = response.data.public_id;
              this.router.navigate(['/communication/memos', response.data.public_id, 'edit'], { replaceUrl: true });
            }
          }
        } else {
          this.saving.set(false);
        }
      },
      error: (err) => {
        this.error.set(`Failed to ${this.isEditMode() ? 'update' : 'create'} memo. Please try again.`);
        this.saving.set(false);
        console.error('Error saving memo:', err);
      }
    });
  }

  cancel(): void {
    this.alertDialogService.confirm({
      zTitle: 'Discard Changes',
      zDescription: 'Are you sure you want to cancel? Any unsaved changes will be lost.',
      zOkText: 'Discard',
      zCancelText: 'Stay',
      zOkDestructive: true,
      zOnOk: () => {
        this.router.navigate(['/communication/memos']);
      }
    });
  }

  // ============== ATTACHMENT SERIALIZATION ==============
  // Attachments are embedded as a hidden HTML block at the end of `content`
  // so the backend needs no separate attachments table. On load we strip it
  // back out and restore the chips list.
  private composeContent(body: string, attachments: MemoAttachment[]): string {
    if (!attachments.length) return body;
    const payload = JSON.stringify(attachments);
    const escaped = this.escapeAttr(payload);
    const links = attachments.map(a =>
      `<a href="${a.dataUrl}" download="${this.escapeAttr(a.name)}" style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;margin:4px 8px 4px 0;color:inherit;text-decoration:none;font-size:13px;">📎 ${this.escapeAttr(a.name)} <span style="opacity:0.6;font-size:11px;">${this.formatSize(a.size)}</span></a>`
    ).join('');
    const block = `<div ${ATTACHMENT_BLOCK_MARKER}="${escaped}" style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;font-weight:500;margin-bottom:8px;">Attachments (${attachments.length})</div>${links}</div>`;
    return body + block;
  }

  private extractAttachments(html: string): { strippedContent: string; parsedAttachments: MemoAttachment[] } {
    if (!html.includes(ATTACHMENT_BLOCK_MARKER)) {
      return { strippedContent: html, parsedAttachments: [] };
    }
    try {
      const container = document.createElement('div');
      container.innerHTML = html;
      const block = container.querySelector(`[${ATTACHMENT_BLOCK_MARKER}]`);
      if (!block) return { strippedContent: html, parsedAttachments: [] };
      const raw = block.getAttribute(ATTACHMENT_BLOCK_MARKER) || '';
      const decoded = raw
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      const parsed: MemoAttachment[] = JSON.parse(decoded);
      block.remove();
      return { strippedContent: container.innerHTML, parsedAttachments: parsed };
    } catch (e) {
      console.warn('Failed to parse memo attachments:', e);
      return { strippedContent: html, parsedAttachments: [] };
    }
  }

  // ============== HELPERS ==============
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

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

  toggleDepartment(dept: string): void {
    const departments: string[] = [...(this.form.get('target_departments')?.value || [])];
    const index = departments.indexOf(dept);
    if (index > -1) departments.splice(index, 1);
    else departments.push(dept);
    this.form.patchValue({ target_departments: departments });
  }

  isDepartmentSelected(dept: string): boolean {
    return (this.form.get('target_departments')?.value || []).includes(dept);
  }

  togglePosition(pos: string): void {
    const positions: string[] = [...(this.form.get('target_positions')?.value || [])];
    const index = positions.indexOf(pos);
    if (index > -1) positions.splice(index, 1);
    else positions.push(pos);
    this.form.patchValue({ target_positions: positions });
  }

  isPositionSelected(pos: string): boolean {
    return (this.form.get('target_positions')?.value || []).includes(pos);
  }

  // ============== SPECIFIC-PEOPLE PICKER ==============
  onEmployeeSearch(event: Event): void {
    this.employeeSearch.set((event.target as HTMLInputElement).value);
  }

  toggleEmployee(id: number): void {
    const ids: number[] = [...(this.form.get('target_employee_ids')?.value || [])];
    const index = ids.indexOf(id);
    if (index > -1) ids.splice(index, 1);
    else ids.push(id);
    this.form.patchValue({ target_employee_ids: ids });
  }

  isEmployeeSelected(id: number): boolean {
    return (this.form.get('target_employee_ids')?.value || []).includes(id);
  }

  employeeName(id: number): string {
    return this.allEmployees().find(e => e.id === id)?.full_name || `Employee #${id}`;
  }

  clearEmployeeSelection(): void {
    this.form.patchValue({ target_employee_ids: [] });
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 10) / 10} ${sizes[i]}`;
  }

  getFileIcon(mime: string): string {
    if (!mime) return 'file';
    if (mime.startsWith('image/')) return 'image';
    if (mime === 'application/pdf') return 'file-text';
    if (mime.includes('word')) return 'file-text';
    if (mime.includes('sheet') || mime.includes('excel')) return 'file-spreadsheet';
    if (mime.includes('zip') || mime.includes('rar')) return 'file-archive';
    if (mime.startsWith('text/')) return 'file-text';
    return 'file';
  }

  private escapeAttr(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
