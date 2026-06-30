import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CashFlowService } from '../../services/cashflow.service';
import { CashFlowSummary } from '../../models/cashflow.model';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { CashFlowCreateDialogComponent } from '../cashflow-create-dialog/cashflow-create-dialog.component';

@Component({
  selector: 'app-cashflow-list',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardTableImports
  ],
  templateUrl: './cashflow-list.component.html'
})
export class CashFlowListComponent implements OnInit {
  private service = inject(CashFlowService);
  private router = inject(Router);
  private dialogService = inject(ZardDialogService);
  private alertDialog = inject(ZardAlertDialogService);

  loading = signal(true);
  statements = signal<CashFlowSummary[]>([]);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (res) => {
        if (res.success) this.statements.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  create() {
    this.dialogService.create({
      zContent: CashFlowCreateDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: false,
      zWidth: '36rem',
      zCustomClasses: 'p-0 gap-0 overflow-hidden',
      zData: {
        onSuccess: (s: any) => this.router.navigate(['/finance/cashflow', s.public_id])
      }
    });
  }

  open(s: CashFlowSummary) {
    this.router.navigate(['/finance/cashflow', s.public_id]);
  }

  remove(s: CashFlowSummary, ev: MouseEvent) {
    ev.stopPropagation();
    this.alertDialog.confirm({
      zTitle: 'Delete Cash Flow Forecast',
      zDescription: `Delete "${s.title}"? This cannot be undone.`,
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.service.remove(s.public_id).subscribe({
          next: (res) => { if (res.success) this.load(); }
        });
      }
    });
  }

  periodLabel(s: CashFlowSummary): string {
    const start = new Date(s.start_month);
    const end = new Date(start);
    end.setMonth(end.getMonth() + s.num_months - 1);
    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    return `${fmt(start)} – ${fmt(end)} · ${s.num_months} mo`;
  }

  money(v: number, currency = 'MYR'): string {
    return `${currency} ${Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
