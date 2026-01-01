# Frontend Implementation Guide - Communications Module

## 📋 Quick Reference

### Files Created & Ready
- ✅ `models/memo.model.ts` - All TypeScript interfaces
- ✅ `models/policy.model.ts` - All TypeScript interfaces
- ✅ `services/memo.service.ts` - Complete HTTP service
- ✅ `services/policy.service.ts` - Complete HTTP service
- ✅ `communication.routes.ts` - All route definitions
- ✅ Component shells generated (6 components)

### What's Next
Implement the component logic and templates following the existing patterns in the claims module.

---

## 🎯 Implementation Order

### 1. Add Routes to App (5 minutes)
**File:** `src/app/app.routes.ts`

Add to the dashboard children routes:
```typescript
{
  path: 'communication',
  loadChildren: () =>
    import('./features/communication/communication.routes').then(
      (m) => m.COMMUNICATION_ROUTES
    ),
  data: { title: 'Communications' }
}
```

### 2. Update Navigation Menu (10 minutes)
**File:** Update your dashboard layout component to add Communication menu item

Add menu item with icon:
```html
<a routerLink="/dashboard/communication/memos" routerLinkActive="active">
  <i class="bi bi-megaphone"></i>
  <span>Memos</span>
</a>
<a routerLink="/dashboard/communication/policies" routerLinkActive="active">
  <i class="bi bi-file-text"></i>
  <span>Policies</span>
</a>
```

### 3. Implement Memo List Component (1-2 hours)

**File:** `src/app/features/communication/components/memo-list/memo-list.ts`

**Reference:** Look at `src/app/features/claims/components/claim-list/claim-list.component.ts`

**Key Implementation Points:**
```typescript
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MemoService } from '../../services/memo.service';
import { Memo, MemoFilters } from '../../models/memo.model';

@Component({
  selector: 'app-memo-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './memo-list.html',
  styleUrl: './memo-list.scss'
})
export class MemoListComponent implements OnInit {
  memos = signal<Memo[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  currentPage = signal(1);
  totalPages = signal(1);
  limit = 10;

  selectedStatus = signal<'' | 'Draft' | 'Published' | 'Archived'>('');
  selectedPriority = signal<'' | 'Low' | 'Normal' | 'High' | 'Urgent'>('');
  searchQuery = signal('');

  constructor(private memoService: MemoService) {}

  ngOnInit(): void {
    this.loadMemos();
  }

  loadMemos(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: MemoFilters = {
      page: this.currentPage(),
      limit: this.limit
    };

    if (this.selectedStatus()) filters.status = this.selectedStatus() as any;
    if (this.selectedPriority()) filters.priority = this.selectedPriority() as any;
    if (this.searchQuery()) filters.search = this.searchQuery();

    this.memoService.getAllMemos(filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.memos.set(response.data);
          this.totalPages.set(response.pagination.totalPages);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load memos');
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadMemos();
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      'Urgent': 'badge bg-danger',
      'High': 'badge bg-warning',
      'Normal': 'badge bg-primary',
      'Low': 'badge bg-secondary'
    };
    return classes[priority] || 'badge bg-secondary';
  }
}
```

**Template Structure:**
```html
<div class="memo-list-container">
  <!-- Header with "New Memo" button -->
  <div class="page-header">
    <h2>Memos & Announcements</h2>
    <a routerLink="/dashboard/communication/memos/new" class="btn btn-primary">
      <i class="bi bi-plus-circle"></i> New Memo
    </a>
  </div>

  <!-- Filters -->
  <div class="filters-card">
    <!-- Status, Priority, Search filters -->
  </div>

  <!-- Memo Cards Grid -->
  <div class="memos-grid" *ngIf="!loading()">
    <div class="memo-card" *ngFor="let memo of memos()">
      <div class="memo-header">
        <span [ngClass]="getPriorityClass(memo.priority)">{{ memo.priority }}</span>
        <span class="memo-date">{{ memo.published_at | date }}</span>
      </div>
      <h3 class="memo-title">{{ memo.title }}</h3>
      <p class="memo-summary">{{ memo.summary }}</p>
      <div class="memo-footer">
        <span class="author">By: {{ memo.author?.full_name }}</span>
        <a [routerLink]="['/dashboard/communication/memos', memo.id]" class="btn btn-sm btn-outline-primary">
          View Details
        </a>
      </div>
    </div>
  </div>

  <!-- Pagination -->
</div>
```

### 4. Implement Memo Viewer Component (1 hour)

**File:** `src/app/features/communication/components/memo-viewer/memo-viewer.ts`

**Key Features:**
- Fetch memo by ID from route params
- Display full HTML content
- Show acknowledge button if required
- Show edit/delete buttons for author/admin
- Display read receipts for admin/manager

```typescript
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MemoService } from '../../services/memo.service';
import { Memo } from '../../models/memo.model';

@Component({
  selector: 'app-memo-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './memo-viewer.html',
  styleUrl: './memo-viewer.scss'
})
export class MemoViewerComponent implements OnInit {
  memo = signal<Memo | null>(null);
  loading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private memoService: MemoService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadMemo(id);
  }

  loadMemo(id: number): void {
    this.loading.set(true);
    this.memoService.getMemoById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.memo.set(response.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading memo:', err);
        this.loading.set(false);
      }
    });
  }

  acknowledgeMemo(): void {
    const id = this.memo()?.id;
    if (!id) return;

    this.memoService.acknowledgeMemo(id).subscribe({
      next: () => {
        alert('Memo acknowledged successfully');
        this.loadMemo(id);
      },
      error: (err) => console.error('Error acknowledging memo:', err)
    });
  }
}
```

### 5. Implement Memo Form Component (2-3 hours)

**File:** `src/app/features/communication/components/memo-form/memo-form.ts`

**Key Features:**
- Create/Edit mode detection
- Rich text editor for content
- Target audience selection
- Priority selection
- Status management (Save as Draft / Publish)
- Form validation

**Before implementing, install rich text editor:**
```bash
npm install ngx-quill quill --save
```

**Then in angular.json, add to styles:**
```json
"styles": [
  "node_modules/quill/dist/quill.snow.css",
  ...
]
```

**Component Structure:**
```typescript
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { MemoService } from '../../services/memo.service';
import { MemoFormData } from '../../models/memo.model';

@Component({
  selector: 'app-memo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './memo-form.html',
  styleUrl: './memo-form.scss'
})
export class MemoFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = signal(false);
  memoId: number | null = null;
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private memoService: MemoService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      summary: [''],
      priority: ['Normal'],
      target_audience: ['All'],
      target_departments: [[]],
      target_positions: [[]],
      target_employee_ids: [[]],
      requires_acknowledgment: [false],
      expires_at: [null]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.memoId = Number(id);
      this.loadMemo(this.memoId);
    }
  }

  loadMemo(id: number): void {
    this.memoService.getMemoById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.form.patchValue(response.data);
        }
      }
    });
  }

  saveAsDraft(): void {
    this.submitForm('Draft');
  }

  publish(): void {
    this.submitForm('Published');
  }

  private submitForm(status: 'Draft' | 'Published'): void {
    if (this.form.invalid) {
      alert('Please fill all required fields');
      return;
    }

    const formData: MemoFormData = {
      ...this.form.value,
      status,
      published_at: status === 'Published' ? new Date().toISOString() : undefined
    };

    const operation = this.isEditMode()
      ? this.memoService.updateMemo(this.memoId!, formData)
      : this.memoService.createMemo(formData);

    operation.subscribe({
      next: () => {
        alert(`Memo ${this.isEditMode() ? 'updated' : 'created'} successfully`);
        this.router.navigate(['/dashboard/communication/memos']);
      },
      error: (err) => console.error('Error saving memo:', err)
    });
  }
}
```

### 6. Implement Policy List Component (1-2 hours)

**Similar to memo-list but with:**
- Category sidebar filter
- Policy code display
- Version information
- Different styling

### 7. Implement Policy Viewer Component (1 hour)

**Similar to memo-viewer but with:**
- Display policy metadata (code, version, effective dates)
- Download PDF button (if file_url exists)
- Approve button (Admin only)
- Version history display

### 8. Implement Policy Form Component (2-3 hours)

**Similar to memo-form but with:**
- Policy code input
- Category dropdown
- Version input
- File upload for PDF
- Tag management
- Effective/Review/Expiry date pickers
- Parent policy selector (for creating new versions)

---

## 🎨 Styling Tips

### Priority Badges
```scss
.badge {
  &.bg-danger { // Urgent
    background-color: #dc3545 !important;
  }
  &.bg-warning { // High
    background-color: #ffc107 !important;
    color: #000;
  }
  &.bg-primary { // Normal
    background-color: #0d6efd !important;
  }
  &.bg-secondary { // Low
    background-color: #6c757d !important;
  }
}
```

### Memo Cards Grid
```scss
.memos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.memo-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
}
```

---

## 🧪 Testing Checklist

### Memo Module
- [ ] Create new memo as Manager
- [ ] View memo list with filters
- [ ] View single memo
- [ ] Acknowledge memo as Staff
- [ ] Edit memo as Author
- [ ] Delete memo as Admin
- [ ] Publish draft memo
- [ ] View statistics (Admin)

### Policy Module
- [ ] Create new policy as Manager
- [ ] View policy list by category
- [ ] View single policy
- [ ] Acknowledge policy as Staff
- [ ] Approve policy as Admin
- [ ] Edit policy as Author
- [ ] Create new version of policy
- [ ] Download PDF attachment

---

## 📚 Reference Components

Use these existing components as templates:

1. **List Components:** `features/claims/components/claim-list`
2. **Form Components:** `features/claims/components/claim-form`
3. **Detail Views:** `features/leave/components/leave-detail`
4. **Filters:** `features/employees/components/employee-list`

---

## 🔧 Rich Text Editor Configuration

### Quill Toolbar Config
```typescript
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
```

### In Template
```html
<quill-editor
  [formControlName]="'content'"
  [modules]="quillConfig"
  placeholder="Enter memo content..."
  class="quill-editor">
</quill-editor>
```

---

## ✅ Completion Checklist

- [ ] Routes added to app.routes.ts
- [ ] Navigation menu updated
- [ ] Memo list component implemented
- [ ] Memo viewer component implemented
- [ ] Memo form component implemented
- [ ] Policy list component implemented
- [ ] Policy viewer component implemented
- [ ] Policy form component implemented
- [ ] Rich text editor integrated
- [ ] Styling completed
- [ ] All components tested
- [ ] Error handling verified
- [ ] Responsive design checked

---

## 🚀 Next Steps After Completion

1. **Add Notifications**
   - Show badge count for unread memos
   - Email notifications for new published memos
   - Push notifications (optional)

2. **File Attachments**
   - Implement file upload for memos
   - Support multiple attachments
   - Preview attachments

3. **Advanced Features**
   - Memo scheduling (publish at future date)
   - Recurring memos (monthly announcements)
   - Memo templates
   - Policy comparison (between versions)
   - Export policies to PDF
   - Policy search with full-text indexing

---

## 📞 Support

For issues or questions:
1. Check existing components for reference
2. Review backend API documentation in `COMMUNICATION_MODULE_STATUS.md`
3. Test API endpoints directly with Postman/Thunder Client
4. Check browser console for errors
5. Verify API base URL in `src/app/core/config/api.config.ts`
