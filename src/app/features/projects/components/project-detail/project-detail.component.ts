import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectTransactions } from '../../models/project.model';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { InvoiceFormDialogComponent, InvoiceFormDialogData } from '@/features/e-invoices/components/invoice-form-dialog/invoice-form-dialog.component';
import { ProjectFormDialogComponent } from '../project-form-dialog/project-form-dialog.component';
import { BillFormDialogComponent } from '@/features/finance/components/bill-form-dialog/bill-form-dialog.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-detail.component.html'
})
export class ProjectDetailComponent implements OnInit {
  private projectService = inject(ProjectService);
  private dialogService = inject(ZardDialogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  project = signal<Project | null>(null);
  transactions = signal<ProjectTransactions>({ invoices: [], bills: [], claims: [] });
  activeTab = signal<'invoices' | 'bills' | 'claims'>('invoices');

  budgetUsedPct = computed(() => {
    const p = this.project();
    if (!p?.budget || !p.financials) return 0;
    const budget = +p.budget;
    if (budget <= 0) return 0;
    const spent = p.financials.total_paid;
    return Math.min(100, parseFloat(((spent / budget) * 100).toFixed(1)));
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string) {
    this.loading.set(true);
    this.projectService.get(id).subscribe({
      next: res => {
        this.project.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.projectService.transactions(id).subscribe({
      next: res => this.transactions.set(res.data)
    });
  }

  edit() {
    const p = this.project();
    if (!p) return;
    this.dialogService.create({
      zContent: ProjectFormDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: false,
      zWidth: '70vw',
      zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-4 !top-4 !bottom-4 !translate-x-0 !translate-y-0 !max-w-none h-[calc(100vh-2rem)] rounded-xl',
      zData: {
        project: p,
        onSuccess: () => this.load(p.public_id)
      }
    });
  }

  createInvoice() {
    const p = this.project();
    if (!p) return;
    this.dialogService.create<InvoiceFormDialogComponent, any>({
      zContent: InvoiceFormDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: false,
      zWidth: '70vw',
      zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-4 !top-4 !bottom-4 !translate-x-0 !translate-y-0 !max-w-none h-[calc(100vh-2rem)] rounded-xl',
      zData: {
        projectId: p.id,
        onSuccess: () => this.load(p.public_id)
      } as InvoiceFormDialogData
    });
  }

  createBill() {
    const p = this.project();
    if (!p) return;
    this.dialogService.create({
      zContent: BillFormDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: false,
      zWidth: '70vw',
      zCustomClasses: 'p-0 gap-0 overflow-hidden !left-auto !right-4 !top-4 !bottom-4 !translate-x-0 !translate-y-0 !max-w-none h-[calc(100vh-2rem)] rounded-xl',
      zData: {
        projectPublicId: p.public_id,
        onSuccess: () => this.load(p.public_id)
      }
    });
  }

  formatMoney(v: number | null | undefined, currency = 'MYR') {
    if (v == null) return '—';
    return `${currency} ${(+v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
