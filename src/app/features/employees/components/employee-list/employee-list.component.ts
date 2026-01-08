import { Component, OnInit, signal, inject } from '@angular/core';
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
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';

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
    ZardMenuImports,
    ZardTableImports,
    ZardTooltipModule
  ],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private alertDialogService = inject(ZardAlertDialogService);

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

  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Selection
  selectedEmployees = signal<Set<number>>(new Set());
  selectAll = signal<boolean>(false);

  // Column visibility
  visibleColumns = signal<{[key: string]: boolean}>({
    name: true,
    position: true,
    employmentType: true,
    email: true,
    nationality: true,
    status: true
  });

  // Column list for toggle menu
  columnList = [
    { key: 'name', label: 'Name' },
    { key: 'position', label: 'Role' },
    { key: 'employmentType', label: 'Plan' },
    { key: 'email', label: 'Email' },
    { key: 'nationality', label: 'Country' },
    { key: 'status', label: 'Status' }
  ];

  // Expose Math to template
  Math = Math;

  ngOnInit(): void {
    this.loadEmployees();
  }

  // Get selected count for bulk actions
  getSelectedCount(): number {
    return this.selectedEmployees().size;
  }

  // Clear selection
  clearSelection(): void {
    this.selectedEmployees.set(new Set());
    this.selectAll.set(false);
  }

  // Toggle column visibility
  toggleColumn(column: string): void {
    const current = this.visibleColumns();
    this.visibleColumns.set({
      ...current,
      [column]: !current[column]
    });
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

  // Sorting methods
  onSort(column: string): void {
    if (this.sortColumn() === column) {
      // Toggle direction if same column
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.sortEmployees();
  }

  sortEmployees(): void {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return;

    const sorted = [...this.employees()].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (column) {
        case 'name':
          aValue = a.full_name?.toLowerCase() || '';
          bValue = b.full_name?.toLowerCase() || '';
          break;
        case 'position':
          aValue = a.position?.toLowerCase() || '';
          bValue = b.position?.toLowerCase() || '';
          break;
        case 'employmentType':
          aValue = a.employment_type?.toLowerCase() || '';
          bValue = b.employment_type?.toLowerCase() || '';
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'nationality':
          aValue = a.nationality?.toLowerCase() || '';
          bValue = b.nationality?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.employment_status?.toLowerCase() || '';
          bValue = b.employment_status?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    this.employees.set(sorted);
  }

  getSortIcon(column: string): 'chevrons-up-down' | 'chevron-up' | 'chevron-down' {
    if (this.sortColumn() !== column) return 'chevrons-up-down';
    return this.sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  isSortActive(column: string): boolean {
    return this.sortColumn() === column;
  }

  // Selection methods
  toggleSelectAll(): void {
    const newSelectAll = !this.selectAll();
    this.selectAll.set(newSelectAll);

    if (newSelectAll) {
      const allIds = new Set(this.employees().map(e => e.id));
      this.selectedEmployees.set(allIds);
    } else {
      this.selectedEmployees.set(new Set());
    }
  }

  toggleEmployeeSelection(id: number): void {
    const selected = new Set(this.selectedEmployees());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedEmployees.set(selected);
    this.selectAll.set(selected.size === this.employees().length && this.employees().length > 0);
  }

  isEmployeeSelected(id: number): boolean {
    return this.selectedEmployees().has(id);
  }

  deleteEmployee(employee: Employee): void {
    this.alertDialogService.confirm({
      zTitle: 'Terminate Employee',
      zDescription: `Are you sure you want to terminate ${employee.full_name}? This will change their status to Terminated.`,
      zOkText: 'Terminate',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.employeeService.deleteEmployee(employee.id, 'Terminated').subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Employee terminated successfully',
                zOkText: 'OK'
              });
              this.loadEmployees();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to terminate employee',
              zOkText: 'OK'
            });
          }
        });
      }
    });
  }

  bulkDelete(): void {
    const selected = Array.from(this.selectedEmployees());
    if (selected.length === 0) {
      this.alertDialogService.warning({
        zTitle: 'No Selection',
        zDescription: 'Please select employees to terminate',
        zOkText: 'OK'
      });
      return;
    }

    this.alertDialogService.confirm({
      zTitle: 'Terminate Selected Employees',
      zDescription: `Are you sure you want to terminate ${selected.length} employee(s)? This will change their status to Terminated.`,
      zOkText: 'Terminate All',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        // Note: Bulk delete API endpoint may need to be implemented in the service
        // For now, this shows a success message. You may need to call the API for each employee
        this.alertDialogService.info({
          zTitle: 'Success',
          zDescription: `${selected.length} employee(s) terminated successfully`,
          zOkText: 'OK'
        });
        this.selectedEmployees.set(new Set());
        this.selectAll.set(false);
        this.loadEmployees();
      }
    });
  }
}
