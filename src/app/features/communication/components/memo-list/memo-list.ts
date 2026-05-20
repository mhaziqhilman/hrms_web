import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MemoService } from '../../services/memo.service';
import { AnnouncementCategoryService } from '../../services/announcement-category.service';
import { AuthService } from '@/core/services/auth.service';
import { UserProfileService } from '@/core/services/user-profile.service';
import { Memo, MemoFilters, MemoFormData, AnnouncementCategory } from '../../models/memo.model';
import { DisplayService } from '@/core/services/display.service';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTooltipDirective } from '@/shared/components/tooltip/tooltip';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

@Component({
  selector: 'app-memo-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardCardComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
    ZardAvatarComponent,
    ZardMenuImports,
    ZardTooltipDirective,
    ZardDatePickerComponent
  ],
  templateUrl: './memo-list.html',
  styleUrl: './memo-list.css',
})
export class MemoListComponent implements OnInit {
  private memoService = inject(MemoService);
  private categoryService = inject(AnnouncementCategoryService);
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private displayService = inject(DisplayService);
  private alertDialogService = inject(ZardAlertDialogService);

  // Data
  memos = signal<Memo[]>([]);
  pinnedMemos = signal<Memo[]>([]);
  categories = signal<AnnouncementCategory[]>([]);
  loading = signal(false);
  totalPublishedCount = signal(0);
  thisWeekStats = signal<{ posts: number; reach: number } | null>(null);

  // Filters
  selectedCategory = signal<AnnouncementCategory | null>(null);
  sortBy = signal<string>('newest');
  statusFilter = signal<'Published' | 'Draft' | 'Archived'>('Published');
  dateFrom = signal<Date | null>(null);
  dateTo = signal<Date | null>(null);
  searchQuery = signal<string>('');

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  pageSize = 10;

  // User context
  currentUser: any = null;

  // Quick post state
  showQuickPost = signal(false);
  quickPostSaving = signal(false);
  quickPostForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    content: ['', Validators.required],
    category_id: [null],
    priority: ['Normal']
  });
  priorities = ['Low', 'Normal', 'High', 'Urgent'];

  // Add new category state
  showAddCategory = signal(false);
  newCategoryName = signal('');
  newCategoryColor = signal('#6B7280');

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.loadCategories();
    this.loadMemos();
    this.loadPinnedMemos();
    this.loadThisWeekStats();
  }

  loadThisWeekStats(): void {
    this.memoService.getThisWeekStats().subscribe({
      next: (res) => this.thisWeekStats.set({ posts: res.data.posts, reach: res.data.reach }),
      error: (err) => console.error('Error loading this-week stats:', err)
    });
  }

  get canCreate(): boolean {
    return ['super_admin', 'admin'].includes(this.currentUser?.role);
  }

  get canManageCategories(): boolean {
    return ['super_admin', 'admin'].includes(this.currentUser?.role);
  }

  get canPin(): boolean {
    return ['super_admin', 'admin'].includes(this.currentUser?.role);
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories.set(res.data.categories);
        this.totalPublishedCount.set(res.data.totalCount);
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  loadMemos(): void {
    this.loading.set(true);
    this.memoImageCache.clear();
    const filters: MemoFilters = {
      page: this.currentPage(),
      limit: this.pageSize,
      sort_by: this.sortBy() as any,
      status: this.statusFilter()
    };

    const category = this.selectedCategory();
    if (category) {
      filters.category_id = category.id;
    }

    if (this.dateFrom()) filters.date_from = this.toDateString(this.dateFrom()!);
    if (this.dateTo()) filters.date_to = this.toDateString(this.dateTo()!);
    if (this.searchQuery()) filters.search = this.searchQuery();

    this.memoService.getAllMemos(filters).subscribe({
      next: (res) => {
        this.memos.set(res.data);
        this.totalPages.set(res.pagination.totalPages);
        this.totalItems.set(res.pagination.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading announcements:', err);
        this.loading.set(false);
      }
    });
  }

  loadPinnedMemos(): void {
    this.memoService.getPinnedMemos().subscribe({
      next: (res) => {
        this.pinnedMemos.set(res.data);
      },
      error: (err) => console.error('Error loading pinned:', err)
    });
  }

  filterByCategory(cat: AnnouncementCategory | null): void {
    this.selectedCategory.set(cat);
    this.currentPage.set(1);
    this.loadMemos();
  }

  onSortChange(): void {
    this.currentPage.set(1);
    this.loadMemos();
  }

  onDateFilterChange(): void {
    this.currentPage.set(1);
    this.loadMemos();
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadMemos();
  }

  clearDateFilter(): void {
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.currentPage.set(1);
    this.loadMemos();
  }

  resetFilters(): void {
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.sortBy.set('newest');
    this.statusFilter.set('Published');
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadMemos();
  }

  onStatusChange(): void {
    this.currentPage.set(1);
    this.loadMemos();
  }

  getStatusLabel(): string {
    switch (this.statusFilter()) {
      case 'Draft': return 'Drafts';
      case 'Archived': return 'Archived';
      default: return 'Published';
    }
  }

  onDateFromChange(date: Date | null): void {
    this.dateFrom.set(date);
    this.onDateFilterChange();
  }

  onDateToChange(date: Date | null): void {
    this.dateTo.set(date);
    this.onDateFilterChange();
  }

  getSortLabel(): string {
    switch (this.sortBy()) {
      case 'oldest': return 'Oldest First';
      case 'priority': return 'Priority';
      default: return 'Sort';
    }
  }

  private toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  navigateToCreate(): void {
    this.router.navigate(['/communication/memos/new']);
  }

  toggleQuickPost(): void {
    this.showQuickPost.set(!this.showQuickPost());
    if (!this.showQuickPost()) {
      this.quickPostForm.reset({ title: '', content: '', category_id: null, priority: 'Normal' });
    }
  }

  submitQuickPost(status: 'Published' | 'Draft'): void {
    if (status === 'Published' && this.quickPostForm.invalid) {
      this.quickPostForm.markAllAsTouched();
      return;
    }

    this.quickPostSaving.set(true);
    const formData: MemoFormData = {
      ...this.quickPostForm.value,
      status,
      target_audience: 'All',
      published_at: status === 'Published' ? new Date().toISOString() : undefined
    };

    this.memoService.createMemo(formData).subscribe({
      next: () => {
        this.showQuickPost.set(false);
        this.quickPostForm.reset({ title: '', content: '', category_id: null, priority: 'Normal' });
        this.quickPostSaving.set(false);
        this.loadMemos();
        this.loadPinnedMemos();
        this.loadCategories();
        this.loadThisWeekStats();
      },
      error: (err) => {
        console.error('Error creating quick post:', err);
        this.quickPostSaving.set(false);
      }
    });
  }

  viewPost(id: number | string | undefined): void {
    if (id) this.router.navigate(['/communication/memos', id]);
  }

  editPost(id: number | string | undefined): void {
    if (id) this.router.navigate(['/communication/memos', id, 'edit']);
  }

  togglePin(memo: Memo): void {
    this.memoService.togglePin(memo.public_id!).subscribe({
      next: () => {
        this.loadMemos();
        this.loadPinnedMemos();
        this.loadCategories();
      },
      error: (err) => console.error('Error toggling pin:', err)
    });
  }

  archiveMemo(memo: Memo): void {
    this.memoService.archiveMemo(memo.public_id!).subscribe({
      next: () => {
        this.loadMemos();
        this.loadPinnedMemos();
        this.loadCategories();
        this.loadThisWeekStats();
      },
      error: (err) => console.error('Error archiving:', err)
    });
  }

  /** Publishes a Draft, or restores an Archived memo back to Published. */
  publishMemo(memo: Memo): void {
    this.memoService.publishMemo(memo.public_id!).subscribe({
      next: () => {
        this.loadMemos();
        this.loadPinnedMemos();
        this.loadCategories();
        this.loadThisWeekStats();
      },
      error: (err) => console.error('Error publishing:', err)
    });
  }

  deleteMemo(memo: Memo): void {
    this.alertDialogService.confirm({
      zTitle: 'Delete Announcement',
      zDescription: 'Are you sure you want to delete this announcement?',
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.memoService.deleteMemo(memo.public_id!).subscribe({
          next: () => {
            this.loadMemos();
            this.loadPinnedMemos();
            this.loadCategories();
            this.loadThisWeekStats();
          },
          error: (err) => console.error('Error deleting:', err)
        });
      }
    });
  }

  // Add category
  toggleAddCategory(): void {
    this.showAddCategory.set(!this.showAddCategory());
    this.editingCategory.set(null);
    this.newCategoryName.set('');
    this.newCategoryColor.set('#6B7280');
  }

  addCategory(): void {
    const name = this.newCategoryName().trim();
    if (!name) return;

    this.categoryService.createCategory({
      name,
      color: this.newCategoryColor()
    }).subscribe({
      next: () => {
        this.loadCategories();
        this.showAddCategory.set(false);
        this.newCategoryName.set('');
      },
      error: (err) => console.error('Error creating category:', err)
    });
  }

  // Edit category
  editingCategory = signal<AnnouncementCategory | null>(null);

  startEditCategory(cat: AnnouncementCategory, event: Event): void {
    event.stopPropagation();
    this.editingCategory.set({ ...cat });
    this.showAddCategory.set(false);
  }

  updateEditingCategoryName(name: string): void {
    const cat = this.editingCategory();
    if (cat) this.editingCategory.set({ ...cat, name });
  }

  updateEditingCategoryColor(color: string): void {
    const cat = this.editingCategory();
    if (cat) this.editingCategory.set({ ...cat, color });
  }

  saveEditCategory(): void {
    const cat = this.editingCategory();
    if (!cat || !cat.name.trim()) return;

    this.categoryService.updateCategory(cat.id, {
      name: cat.name.trim(),
      color: cat.color
    }).subscribe({
      next: () => {
        this.loadCategories();
        this.editingCategory.set(null);
      },
      error: (err) => console.error('Error updating category:', err)
    });
  }

  cancelEditCategory(): void {
    this.editingCategory.set(null);
  }

  deleteCategory(cat: AnnouncementCategory, event: Event): void {
    event.stopPropagation();
    this.alertDialogService.confirm({
      zTitle: 'Delete Category',
      zDescription: `Delete category "${cat.name}"? Announcements in this category will become uncategorized.`,
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.categoryService.deleteCategory(cat.id).subscribe({
          next: () => {
            if (this.selectedCategory()?.id === cat.id) {
              this.filterByCategory(null);
            }
            this.loadCategories();
          },
          error: (err) => console.error('Error deleting category:', err)
        });
      }
    });
  }

  // Pagination
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadMemos();
  }

  // Helpers
  getAuthorName(memo: Memo): string {
    return memo.author?.employee?.full_name || memo.author?.email || 'Unknown';
  }

  getAuthorPosition(memo: Memo): string {
    return memo.author?.employee?.position || memo.author?.role || '';
  }

  getAuthorPhoto(memo: Memo): string {
    return memo.author?.employee?.photo_url || '';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getCurrentUserPhoto(): string {
    return this.userProfileService.profilePictureUrl() || '';
  }

  getCurrentUserInitials(): string {
    const name = this.currentUser?.full_name || this.currentUser?.email || '';
    return this.getInitials(name);
  }

  getContentPreview(memo: Memo): string {
    if (memo.summary) return memo.summary;
    // Strip HTML tags for preview
    const text = memo.content.replace(/<[^>]*>/g, '');
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }

  /**
   * First image embedded in the memo body, shown as a 1:1 cover on the card.
   * Cached per-memo since `content` can be large (base64 data URLs) and this
   * runs inside change detection.
   */
  private memoImageCache = new Map<string | number, string | null>();
  getMemoImage(memo: Memo): string | null {
    const key = memo.id ?? memo.public_id ?? memo.title;
    const cached = this.memoImageCache.get(key);
    if (cached !== undefined) return cached;
    const match = memo.content?.match(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i);
    const url = match ? match[1] : null;
    this.memoImageCache.set(key, url);
    return url;
  }

  formatDate(dateStr?: string): string {
    return this.displayService.formatDate(dateStr);
  }

  formatDateTime(dateStr?: string): string {
    return this.displayService.formatDateTime(dateStr);
  }

  canEditMemo(memo: Memo): boolean {
    return ['super_admin', 'admin'].includes(this.currentUser?.role) || memo.author_id === this.currentUser?.id;
  }

  getCategoryChipBg(color?: string): string {
    const hex = (color || '#6B7280').replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.12)`;
  }

  getCategoryChipText(color?: string): string {
    return color || '#6B7280';
  }

  get lastUpdated(): string {
    const list = this.memos();
    if (!list.length) return '';
    const latest = list.reduce((a, b) => {
      const aDate = new Date(a.published_at || a.created_at);
      const bDate = new Date(b.published_at || b.created_at);
      return aDate > bDate ? a : b;
    });
    return this.formatDate(latest.published_at || latest.created_at);
  }

  get pinnedCount(): number {
    return this.pinnedMemos().length;
  }
}
