import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PolicyService } from '../../services/policy.service';
import { Policy, PolicyFilters } from '../../models/policy.model';

// ZardUI Component Imports
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardTooltipDirective } from '@/shared/components/tooltip/tooltip';
import { AppDatePipe } from '@/shared/pipes/app-date.pipe';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardTooltipDirective,
    AppDatePipe
  ],
  templateUrl: './policy-list.html',
  styleUrl: './policy-list.css',
})
export class PolicyListComponent implements OnInit {
  Math = Math;

  policies = signal<Policy[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  limit = 10;

  // Filters
  selectedStatus = signal<'' | 'Draft' | 'Active' | 'Archived' | 'Superseded'>('');
  selectedCategory = signal<'' | 'HR' | 'IT' | 'Finance' | 'Safety' | 'Compliance' | 'Operations' | 'Other'>('');
  searchQuery = signal('');

  constructor(private policyService: PolicyService) {}

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: PolicyFilters = {
      page: this.currentPage(),
      limit: this.limit
    };

    if (this.selectedStatus()) filters.status = this.selectedStatus() as any;
    if (this.selectedCategory()) filters.category = this.selectedCategory() as any;
    if (this.searchQuery()) filters.search = this.searchQuery();

    this.policyService.getAllPolicies(filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.policies.set(response.data);
          this.totalPages.set(response.pagination.totalPages);
          this.totalItems.set(response.pagination.total);
          this.currentPage.set(response.pagination.page);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load policies. Please try again.');
        this.loading.set(false);
        console.error('Error loading policies:', err);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadPolicies();
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadPolicies();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPolicies();
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

  clearFilters(): void {
    this.selectedStatus.set('');
    this.selectedCategory.set('');
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadPolicies();
  }

  refreshPolicies(): void {
    this.loadPolicies();
  }

  isExpired(policy: Policy): boolean {
    if (!policy.expires_at) return false;
    return new Date(policy.expires_at) < new Date();
  }
}
