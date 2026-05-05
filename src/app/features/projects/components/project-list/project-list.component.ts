import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectStatus } from '../../models/project.model';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { ProjectFormDialogComponent } from '../project-form-dialog/project-form-dialog.component';

type BadgeType = 'soft-gray' | 'soft-blue' | 'soft-green' | 'soft-yellow' | 'soft-red';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardMenuImports,
    ZardTableImports
  ],
  templateUrl: './project-list.component.html'
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private dialogService = inject(ZardDialogService);

  loading = signal(true);
  projects = signal<Project[]>([]);
  pagination = signal({ page: 1, limit: 15, totalItems: 0, totalPages: 0 });
  statusFilter = signal<ProjectStatus | ''>('');
  searchTerm = signal('');
  private searchTimeout: any;

  statuses: { value: ProjectStatus; label: string }[] = [
    { value: 'Planning', label: 'Planning' },
    { value: 'Active', label: 'Active' },
    { value: 'On_Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  hasActiveFilters = computed(() => !!(this.statusFilter() || this.searchTerm()));

  pageRange = computed(() => {
    const total = this.pagination().totalPages;
    const max = 5;
    return Array.from({ length: Math.min(total, max) }, (_, i) => i + 1);
  });

  statusLabel = computed(() => {
    const v = this.statusFilter();
    if (!v) return 'Status';
    return this.statuses.find(s => s.value === v)?.label || v;
  });

  ngOnInit() {
    this.load(1);
  }

  load(page = 1) {
    this.loading.set(true);
    this.projectService.list({
      page, limit: 15,
      status: this.statusFilter() || undefined,
      search: this.searchTerm() || undefined,
      sort: 'created_at',
      order: 'DESC'
    }).subscribe({
      next: res => {
        this.projects.set(res.data.projects);
        this.pagination.set(res.data.pagination);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(1), 350);
  }

  setStatus(s: ProjectStatus | '') {
    this.statusFilter.set(s);
    this.load(1);
  }

  resetFilters() {
    this.searchTerm.set('');
    this.statusFilter.set('');
    this.load(1);
  }

  goToDetail(project: Project) {
    this.router.navigate(['/projects', project.public_id]);
  }

  goToCreate() {
    this.openCreateDialog('manual');
  }

  goToCreateFromPo() {
    this.openCreateDialog('po');
  }

  private openCreateDialog(source: 'manual' | 'po') {
    this.dialogService.create({
      zContent: ProjectFormDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: false,
      zWidth: '70vw',
      zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-4 !top-4 !bottom-4 !translate-x-0 !translate-y-0 !max-w-none h-[calc(100vh-2rem)] rounded-xl',
      zData: {
        source,
        onSuccess: (project: Project) => {
          this.load(this.pagination().page);
          this.router.navigate(['/projects', project.public_id]);
        }
      }
    });
  }

  goToEdit(p: Project, ev?: MouseEvent) {
    if (ev) ev.stopPropagation();
    this.dialogService.create({
      zContent: ProjectFormDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: false,
      zWidth: '70vw',
      zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-4 !top-4 !bottom-4 !translate-x-0 !translate-y-0 !max-w-none h-[calc(100vh-2rem)] rounded-xl',
      zData: {
        project: p,
        onSuccess: () => this.load(this.pagination().page)
      }
    });
  }

  badgeType(status: ProjectStatus): BadgeType {
    switch (status) {
      case 'Active': return 'soft-green';
      case 'Planning': return 'soft-blue';
      case 'On_Hold': return 'soft-yellow';
      case 'Completed': return 'soft-gray';
      case 'Cancelled': return 'soft-red';
      default: return 'soft-gray';
    }
  }

  statusDot(status: ProjectStatus): string {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Planning': return 'bg-blue-500';
      case 'On_Hold': return 'bg-yellow-500';
      case 'Completed': return 'bg-slate-400';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  }

  formatBudget(p: Project): string {
    if (!p.budget) return '—';
    const v = +p.budget;
    return `${p.currency} ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
}
