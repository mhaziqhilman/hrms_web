import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MemoService } from '../../services/memo.service';
import { Memo, MemoFilters } from '../../models/memo.model';

// ZardUI Component Imports
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardTooltipDirective } from '@/shared/components/tooltip/tooltip';

@Component({
  selector: 'app-memo-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardCardComponent,
    ZardBadgeComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardInputDirective,
    ZardTooltipDirective
  ],
  templateUrl: './memo-list.html',
  styleUrl: './memo-list.css',
})
export class MemoListComponent implements OnInit {
  // Expose Math to template
  Math = Math;

  memos = signal<Memo[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  limit = 10;

  // Filters
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
          console.log(response.data);
          
          this.memos.set(response.data);
          this.totalPages.set(response.pagination.totalPages);
          this.totalItems.set(response.pagination.total);
          this.currentPage.set(response.pagination.page);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load memos. Please try again.');
        this.loading.set(false);
        console.error('Error loading memos:', err);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadMemos();
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadMemos();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadMemos();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  getPriorityBadgeType(priority: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Urgent': 'destructive',
      'High': 'default',
      'Normal': 'secondary',
      'Low': 'outline'
    };
    return variantMap[priority] || 'secondary';
  }

  getStatusBadgeType(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Published': 'default',
      'Draft': 'secondary',
      'Archived': 'outline'
    };
    return variantMap[status] || 'secondary';
  }

  clearFilters(): void {
    this.selectedStatus.set('');
    this.selectedPriority.set('');
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadMemos();
  }

  refreshMemos(): void {
    this.loadMemos();
  }

  isExpired(memo: Memo): boolean {
    if (!memo.expires_at) return false;
    return new Date(memo.expires_at) < new Date();
  }
}
