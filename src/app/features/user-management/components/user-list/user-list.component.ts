import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UserManagementService,
  UserRecord,
  UnlinkedEmployee,
  UserListParams,
  UserCompanyInfo
} from '../../services/user-management.service';
import { CompanyService } from '@/core/services/company.service';
import { AuthService } from '@/core/services/auth.service';
import { Company } from '@/core/models/auth.models';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardMenuImports,
    ZardTableImports,
    ZardTooltipModule,
    ZardDividerComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  private userService = inject(UserManagementService);
  private companyService = inject(CompanyService);
  private authService = inject(AuthService);
  private alertDialogService = inject(ZardAlertDialogService);

  // Role-based UI
  isSuperAdmin = computed(() => this.authService.currentUserSignal()?.role === 'super_admin');

  users = signal<UserRecord[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalUsers = signal(0);
  limit = signal(10);

  // Filters
  searchTerm = signal('');
  roleFilter = signal('');
  activeFilter = signal('');
  companyFilter = signal('');

  // Available roles
  roles = ['super_admin', 'admin', 'manager', 'staff'];

  // Companies for filter dropdown
  companies = signal<Company[]>([]);

  // Link employee modal state
  showLinkModal = signal(false);
  linkingUserId = signal<number | null>(null);
  linkingUserEmail = signal('');
  unlinkedEmployees = signal<UnlinkedEmployee[]>([]);
  loadingEmployees = signal(false);
  employeeSearchTerm = signal('');

  // Reset password modal state
  showResetModal = signal(false);
  resetUserId = signal<number | null>(null);
  resetUserEmail = signal('');
  newPassword = signal('');

  // Sorting
  sortColumn = signal('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  Math = Math;

  ngOnInit(): void {
    // Only super_admin can see company filter (needs all companies list)
    if (this.isSuperAdmin()) {
      this.loadCompanies();
    }
    this.loadUsers();
  }

  loadCompanies(): void {
    this.companyService.getAllCompanies().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.companies.set(res.data);
        }
      }
    });
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: UserListParams = {
      page: this.currentPage(),
      limit: this.limit(),
      search: this.searchTerm() || undefined,
      role: this.roleFilter() || undefined,
      is_active: this.activeFilter() || undefined,
      company_id: this.companyFilter() || undefined
    };

    this.userService.getUsers(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.users.set(response.data.users);
          this.totalPages.set(response.data.pagination.totalPages);
          this.totalUsers.set(response.data.pagination.total);
          this.currentPage.set(response.data.pagination.currentPage);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load users');
        this.loading.set(false);
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.roleFilter.set('');
    this.activeFilter.set('');
    this.companyFilter.set('');
    this.currentPage.set(1);
    this.loadUsers();
  }

  // --- Role Management ---
  changeRole(user: UserRecord, newRole: string): void {
    if (user.role === newRole) return;

    this.alertDialogService.confirm({
      zTitle: 'Change User Role',
      zDescription: `Change role of ${user.email} from "${formatRoleLabel(user.role)}" to "${formatRoleLabel(newRole)}"?`,
      zOkText: 'Change Role',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.userService.updateUserRole(user.id, newRole).subscribe({
          next: () => {
            this.loadUsers();
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: err.error?.message || 'Failed to update role',
              zOkText: 'OK'
            });
          }
        });
      }
    });
  }

  // --- Toggle Active ---
  toggleActive(user: UserRecord): void {
    const action = user.is_active ? 'deactivate' : 'activate';

    this.alertDialogService.confirm({
      zTitle: `${user.is_active ? 'Deactivate' : 'Activate'} User`,
      zDescription: `Are you sure you want to ${action} ${user.email}?${user.is_active ? ' They will no longer be able to log in.' : ''}`,
      zOkText: user.is_active ? 'Deactivate' : 'Activate',
      zCancelText: 'Cancel',
      zOkDestructive: user.is_active,
      zOnOk: () => {
        this.userService.toggleUserActive(user.id, !user.is_active).subscribe({
          next: () => {
            this.loadUsers();
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: err.error?.message || `Failed to ${action} user`,
              zOkText: 'OK'
            });
          }
        });
      }
    });
  }

  // --- Link Employee ---
  openLinkModal(user: UserRecord): void {
    this.linkingUserId.set(user.id);
    this.linkingUserEmail.set(user.email);
    this.showLinkModal.set(true);
    this.employeeSearchTerm.set('');
    this.loadUnlinkedEmployees();
  }

  closeLinkModal(): void {
    this.showLinkModal.set(false);
    this.linkingUserId.set(null);
    this.linkingUserEmail.set('');
  }

  loadUnlinkedEmployees(): void {
    this.loadingEmployees.set(true);
    this.userService.getUnlinkedEmployees().subscribe({
      next: (response) => {
        if (response.success) {
          this.unlinkedEmployees.set(response.data);
        }
        this.loadingEmployees.set(false);
      },
      error: () => {
        this.loadingEmployees.set(false);
      }
    });
  }

  getFilteredEmployees(): UnlinkedEmployee[] {
    const term = this.employeeSearchTerm().toLowerCase();
    if (!term) return this.unlinkedEmployees();
    return this.unlinkedEmployees().filter(e =>
      e.full_name.toLowerCase().includes(term) ||
      e.employee_id.toLowerCase().includes(term) ||
      (e.department && e.department.toLowerCase().includes(term))
    );
  }

  linkEmployee(employeeId: number): void {
    const userId = this.linkingUserId();
    if (!userId) return;

    this.userService.linkUserToEmployee(userId, employeeId).subscribe({
      next: () => {
        this.closeLinkModal();
        this.loadUsers();
      },
      error: (err) => {
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: err.error?.message || 'Failed to link employee',
          zOkText: 'OK'
        });
      }
    });
  }

  unlinkEmployee(user: UserRecord): void {
    this.alertDialogService.confirm({
      zTitle: 'Unlink Employee',
      zDescription: `Remove the link between user "${user.email}" and employee "${user.employee?.full_name}"?`,
      zOkText: 'Unlink',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.userService.unlinkUserFromEmployee(user.id).subscribe({
          next: () => {
            this.loadUsers();
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: err.error?.message || 'Failed to unlink employee',
              zOkText: 'OK'
            });
          }
        });
      }
    });
  }

  // --- Reset Password ---
  openResetModal(user: UserRecord): void {
    this.resetUserId.set(user.id);
    this.resetUserEmail.set(user.email);
    this.newPassword.set('');
    this.showResetModal.set(true);
  }

  closeResetModal(): void {
    this.showResetModal.set(false);
    this.resetUserId.set(null);
    this.resetUserEmail.set('');
    this.newPassword.set('');
  }

  resetPassword(): void {
    const userId = this.resetUserId();
    const password = this.newPassword();
    if (!userId || !password || password.length < 8) return;

    this.userService.resetUserPassword(userId, password).subscribe({
      next: () => {
        this.closeResetModal();
        this.alertDialogService.info({
          zTitle: 'Success',
          zDescription: 'Password has been reset successfully',
          zOkText: 'OK'
        });
      },
      error: (err) => {
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: err.error?.message || 'Failed to reset password',
          zOkText: 'OK'
        });
      }
    });
  }

  // --- Helpers ---
  getRoleBadgeType(role: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  }

  formatRole(role: string): string {
    return formatRoleLabel(role);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getUserInitial(user: UserRecord): string {
    if (user.employee?.full_name) {
      return user.employee.full_name.charAt(0).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  }

  getDisplayName(user: UserRecord): string {
    return user.employee?.full_name || user.email.split('@')[0];
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm() || this.roleFilter() || this.activeFilter() || this.companyFilter());
  }

  getCompanyFilterName(): string {
    const id = this.companyFilter();
    if (!id) return 'Company';
    const company = this.companies().find(c => c.id === parseInt(id));
    return company?.name || 'Company';
  }

  // Sorting
  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.sortUsers();
  }

  sortUsers(): void {
    const column = this.sortColumn();
    const direction = this.sortDirection();
    if (!column) return;

    const sorted = [...this.users()].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (column) {
        case 'email': aVal = a.email; bVal = b.email; break;
        case 'role': aVal = a.role; bVal = b.role; break;
        case 'company': aVal = a.company?.name || ''; bVal = b.company?.name || ''; break;
        case 'status': aVal = a.is_active ? 1 : 0; bVal = b.is_active ? 1 : 0; break;
        case 'lastLogin': aVal = a.last_login_at || ''; bVal = b.last_login_at || ''; break;
        default: return 0;
      }
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    this.users.set(sorted);
  }

  getSortIcon(column: string): 'chevrons-up-down' | 'chevron-up' | 'chevron-down' {
    if (this.sortColumn() !== column) return 'chevrons-up-down';
    return this.sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down';
  }
}

function formatRoleLabel(role: string): string {
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
