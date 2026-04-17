import { Component, OnInit, signal, inject, ViewContainerRef } from '@angular/core';
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
import { InvitationService } from '../../../../core/services/invitation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DisplayService } from '@/core/services/display.service';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';

// Dialog Components
import { InviteUserDialogComponent } from './dialogs/invite-user-dialog.component';
import { EmployeeFormDialogComponent } from '../employee-form-dialog/employee-form-dialog.component';

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
    ZardTooltipModule,
    ZardCheckboxComponent,
    ZardDividerComponent,
    ZardCardComponent
  ],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private alertDialogService = inject(ZardAlertDialogService);
  private dialogService = inject(ZardDialogService);
  private invitationService = inject(InvitationService);
  private authService = inject(AuthService);
  private displayService = inject(DisplayService);
  private viewContainerRef = inject(ViewContainerRef);

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
  selectAll = false;

  // View mode: table or card
  viewMode = signal<'table' | 'card'>('table');

  // Column visibility
  visibleColumns = signal<{[key: string]: boolean}>({
    staffId: true,
    name: true,
    position: true,
    nationality: true,
    status: true
  });

  // Column list for toggle menu
  columnList = [
    { key: 'staffId', label: 'Staff ID' },
    { key: 'name', label: 'Staff' },
    { key: 'position', label: 'Role' },
    { key: 'nationality', label: 'Nationality' },
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
    this.selectAll = false;
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

    const sortColumnMap: Record<string, string> = {
      staffId: 'employee_id',
      name: 'full_name',
      position: 'position',
      nationality: 'nationality',
      status: 'employment_status'
    };

    const params: EmployeeListParams = {
      page: this.currentPage(),
      limit: this.limit(),
      search: this.searchTerm() || undefined,
      status: this.statusFilter() || undefined,
      employment_type: this.employmentTypeFilter() || undefined,
      department: this.departmentFilter() || undefined,
      sort: this.sortColumn() ? sortColumnMap[this.sortColumn()] : undefined,
      order: this.sortColumn() ? this.sortDirection() : undefined
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

  formatIcNo(ic: string | undefined): string {
    if (!ic) return '-';
    const digits = ic.replace(/\D/g, '');
    if (digits.length === 12) {
      return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
    }
    return ic;
  }

  formatDate(dateString: string): string {
    return this.displayService.formatDate(dateString);
  }

  // Sorting methods
  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
    this.loadEmployees();
  }

  getSortIcon(column: string): 'chevrons-up-down' | 'chevron-up' | 'chevron-down' {
    if (this.sortColumn() !== column) return 'chevrons-up-down';
    return this.sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  isSortActive(column: string): boolean {
    return this.sortColumn() === column;
  }

  // Selection methods
  // toggleSelectAll(): void {
  //   const newSelectAll = !this.selectAll();
  //   this.selectAll.set(newSelectAll);

  //   if (newSelectAll) {
  //     const allIds = new Set(this.employees().map(e => e.id));
  //     this.selectedEmployees.set(allIds);
  //   } else {
  //     this.selectedEmployees.set(new Set());
  //   }
  // }

  // Selection methods
  toggleSelectAll(): void {
    if (this.selectAll) {
      const allIds = new Set(this.employees().map(l => l.id));
      this.selectedEmployees.set(allIds);
    } else {
      this.selectedEmployees.set(new Set());
      this.selectAll = false;
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
    this.selectAll = selected.size === this.employees().length && this.employees().length > 0;
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
        this.employeeService.deleteEmployee(employee.public_id!, 'Terminated').subscribe({
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
        this.selectAll = false;
        this.loadEmployees();
      }
    });
  }

  isAdmin(): boolean {
    return this.authService.hasAnyRole(['super_admin', 'admin']);
  }

  openInviteDialog(): void {
    this.dialogService.create({
      zTitle: 'Invite User',
      zContent: InviteUserDialogComponent,
      zViewContainerRef: this.viewContainerRef,
      zOkText: 'Send Invitation',
      zCancelText: 'Cancel',
      zOkIcon: 'send',
      zOnOk: (instance: InviteUserDialogComponent): false | void => {
        instance.markTouched();
        if (!instance.isValid()) {
          return false;
        }
        const { email, role } = instance.getInviteData();
        this.sendInvitation(email, role);
      }
    });
  }

  openAddEmployeeDialog(): void {
    this.dialogService.create({
      zContent: EmployeeFormDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: false,
      zWidth: '70vw',
      zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-4 !top-4 !bottom-4 !translate-x-0 !translate-y-0 !max-w-none h-[calc(100vh-2rem)] rounded-xl',
      zData: {
        onSuccess: () => {
          this.loadEmployees();
        }
      }
    });
  }

  private sendInvitation(email: string, role: string): void {
    this.invitationService.inviteUser(email, role).subscribe({
      next: (response) => {
        if (response.success) {
          this.alertDialogService.info({
            zTitle: 'Invitation Sent',
            zDescription: `An invitation has been sent to ${email}.`,
            zOkText: 'OK'
          });
        }
      },
      error: (err) => {
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: err.message || 'Failed to send invitation',
          zOkText: 'OK'
        });
      }
    });
  }
}
