import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// ZardUI Components
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

// Services & Models
import { FeedbackService } from '../../services/feedback.service';
import { Feedback, FeedbackStats, FeedbackCategory, FeedbackStatus, FeedbackFilters } from '../../models/feedback.model';
import { TimeAgoPipe } from '@/shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-feedback-list',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardMenuImports,
    ZardDividerComponent,
    ZardSkeletonComponent,
    ZardTableImports,
    TimeAgoPipe
  ],
  templateUrl: './feedback-list.component.html',
  styleUrls: ['./feedback-list.component.css']
})
export class FeedbackListComponent implements OnInit {
  private feedbackService = inject(FeedbackService);
  private alertDialogService = inject(ZardAlertDialogService);

  loading = signal(true);
  feedbacks = signal<Feedback[]>([]);
  stats = signal<FeedbackStats | null>(null);
  pagination = signal({ total: 0, currentPage: 1, limit: 15, totalPages: 0 });

  // Filters
  statusFilter = signal<FeedbackStatus | ''>('');
  categoryFilter = signal<FeedbackCategory | ''>('');
  searchTerm = signal('');
  private searchTimeout: any;

  // Detail panel
  selectedFeedback = signal<Feedback | null>(null);
  updatingStatus = signal(false);

  categories: { value: FeedbackCategory; label: string }[] = [
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'ui_ux', label: 'UI/UX' },
    { value: 'performance', label: 'Performance' },
    { value: 'general', label: 'General' }
  ];

  statuses: { value: FeedbackStatus; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'in_review', label: 'In Review' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  ngOnInit(): void {
    this.loadFeedback();
    this.loadStats();
  }

  loadFeedback(page = 1): void {
    this.loading.set(true);
    const filters: FeedbackFilters = {
      page,
      limit: 15,
      sort: 'created_at',
      order: 'DESC'
    };
    if (this.statusFilter()) filters.status = this.statusFilter() as FeedbackStatus;
    if (this.categoryFilter()) filters.category = this.categoryFilter() as FeedbackCategory;
    if (this.searchTerm()) filters.search = this.searchTerm();

    this.feedbackService.getAllFeedback(filters).subscribe({
      next: (res) => {
        if (res.success) {
          this.feedbacks.set(res.data);
          if (res.pagination) {
            this.pagination.set(res.pagination);
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadStats(): void {
    this.feedbackService.getFeedbackStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats.set(res.data);
        }
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadFeedback(1);
    }, 400);
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status as FeedbackStatus | '');
    this.loadFeedback(1);
  }

  onCategoryFilterChange(category: string): void {
    this.categoryFilter.set(category as FeedbackCategory | '');
    this.loadFeedback(1);
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.categoryFilter.set('');
    this.searchTerm.set('');
    this.loadFeedback(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination().totalPages) return;
    this.loadFeedback(page);
  }

  selectFeedback(feedback: Feedback): void {
    if (this.selectedFeedback()?.id === feedback.id) {
      this.selectedFeedback.set(null);
    } else {
      this.selectedFeedback.set(feedback);
    }
  }

  updateStatus(feedback: Feedback, newStatus: FeedbackStatus): void {
    this.updatingStatus.set(true);
    this.feedbackService.updateFeedbackStatus(feedback.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadFeedback(this.pagination().currentPage);
          this.loadStats();
          if (this.selectedFeedback()?.id === feedback.id) {
            this.selectedFeedback.set({ ...feedback, status: newStatus });
          }
        }
        this.updatingStatus.set(false);
      },
      error: () => {
        this.updatingStatus.set(false);
      }
    });
  }

  deleteFeedback(feedback: Feedback): void {
    this.alertDialogService.confirm({
      zTitle: 'Delete Feedback',
      zDescription: `Are you sure you want to delete this feedback from ${feedback.user?.employee?.full_name || feedback.user?.email || 'Unknown user'}?`,
      zOkText: 'Delete',
      zOkDestructive: true,
      zOnOk: () => {
        this.feedbackService.deleteFeedback(feedback.id).subscribe({
          next: () => {
            this.loadFeedback(this.pagination().currentPage);
            this.loadStats();
            if (this.selectedFeedback()?.id === feedback.id) {
              this.selectedFeedback.set(null);
            }
          }
        });
      }
    });
  }

  getStatusCount(status: FeedbackStatus): number {
    const stat = this.stats()?.by_status?.find(s => s.status === status);
    return stat?.count || 0;
  }

  getCategoryLabel(category: FeedbackCategory): string {
    const labels: Record<string, string> = {
      bug: 'Bug',
      feature_request: 'Feature',
      ui_ux: 'UI/UX',
      performance: 'Performance',
      general: 'General'
    };
    return labels[category] || category;
  }

  getCategoryBadgeType(category: FeedbackCategory): string {
    const types: Record<string, string> = {
      bug: 'destructive',
      feature_request: 'default',
      ui_ux: 'secondary',
      performance: 'outline',
      general: 'secondary'
    };
    return types[category] || 'secondary';
  }

  getStatusBadgeType(status: FeedbackStatus): string {
    const types: Record<string, string> = {
      new: 'default',
      in_review: 'secondary',
      resolved: 'outline',
      closed: 'outline'
    };
    return types[status] || 'secondary';
  }

  getStatusLabel(status: FeedbackStatus): string {
    const labels: Record<string, string> = {
      new: 'New',
      in_review: 'In Review',
      resolved: 'Resolved',
      closed: 'Closed'
    };
    return labels[status] || status;
  }

  getRatingStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  truncateText(text: string, maxLen = 80): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + '...';
  }
}
