import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import {
  Employee,
  EmployeeListParams,
  EmploymentStatus,
  EmploymentType
} from '../../models/employee.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardMenuImports
  ],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  employees = signal<Employee[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalEmployees = signal<number>(0);
  limit = signal<number>(10);

  // Filters
  searchTerm = signal<string>('');
  statusFilter = signal<EmploymentStatus | ''>('');
  employmentTypeFilter = signal<EmploymentType | ''>('');
  departmentFilter = signal<string>('');

  // Available filter options
  employmentStatuses: EmploymentStatus[] = ['Active', 'Resigned', 'Terminated'];
  employmentTypes: EmploymentType[] = ['Permanent', 'Contract', 'Probation', 'Intern'];

  // Expose Math to template
  Math = Math;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: EmployeeListParams = {
      page: this.currentPage(),
      limit: this.limit(),
      search: this.searchTerm() || undefined,
      status: this.statusFilter() || undefined,
      employment_type: this.employmentTypeFilter() || undefined,
      department: this.departmentFilter() || undefined
    };

    this.employeeService.getEmployees(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.employees.set(response.data.employees);
          this.totalPages.set(response.data.pagination.totalPages);
          this.totalEmployees.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.currentPage);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load employees');
        this.loading.set(false);
      }
    });
  }

  onSearch(searchTerm: string): void {
    this.searchTerm.set(searchTerm);
    this.currentPage.set(1);
    this.loadEmployees();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadEmployees();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadEmployees();
    }
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('');
    this.employmentTypeFilter.set('');
    this.departmentFilter.set('');
    this.currentPage.set(1);
    this.loadEmployees();
  }

  getStatusBadgeClass(status: EmploymentStatus): string {
    const statusMap: Record<EmploymentStatus, string> = {
      'Active': 'badge-light-success',
      'Resigned': 'badge-light-warning',
      'Terminated': 'badge-light-danger'
    };
    return statusMap[status] || 'badge-light-secondary';
  }

  getEmploymentTypeBadgeClass(type: EmploymentType): string {
    const typeMap: Record<EmploymentType, string> = {
      'Permanent': 'badge-light-primary',
      'Contract': 'badge-light-info',
      'Probation': 'badge-light-warning',
      'Intern': 'badge-light-secondary'
    };
    return typeMap[type] || 'badge-light-secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
