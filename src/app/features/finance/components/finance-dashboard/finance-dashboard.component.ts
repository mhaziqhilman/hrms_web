import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HighchartsChartComponent } from 'highcharts-angular';
import type { Options } from 'highcharts';
import { FinanceService } from '../../services/finance.service';
import { ProjectService } from '@/features/projects/services/project.service';
import { PnLSummary, ProjectPnl, SalesByMonth, ExpensesByCategory } from '../../models/finance.model';
import { Project } from '@/features/projects/models/project.model';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { ThemeService } from '@/core/services/theme';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HighchartsChartComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardDatePickerComponent
  ],
  templateUrl: './finance-dashboard.component.html'
})
export class FinanceDashboardComponent implements OnInit {
  private financeService = inject(FinanceService);
  private projectService = inject(ProjectService);
  private themeService = inject(ThemeService);

  isDark = this.themeService.darkMode;

  loading = signal(true);
  pnl = signal<PnLSummary | null>(null);
  projectsPnl = signal<ProjectPnl[]>([]);
  sales = signal<SalesByMonth | null>(null);
  expenses = signal<ExpensesByCategory | null>(null);
  projects = signal<Project[]>([]);

  selectedProject = signal<string>('');
  fromDate = signal<string>('');
  toDate = signal<string>('');
  year = signal<number>(new Date().getFullYear());

  monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Expose Math for inline clamping in templates
  Math = Math;

  // Receivables tile metrics derived from sales by month
  invoicedThisMonth = computed(() => {
    const s = this.sales();
    if (!s) return 0;
    const m = new Date().getMonth() + 1;
    const row = s.by_month.find(x => x.month === m);
    return row ? Number(row.invoiced || 0) : 0;
  });

  receivedThisMonth = computed(() => {
    const s = this.sales();
    if (!s) return 0;
    const m = new Date().getMonth() + 1;
    const row = s.by_month.find(x => x.month === m);
    return row ? Number(row.received || 0) : 0;
  });

  totalReceivable = computed(() => Number(this.pnl()?.sales.receivable || 0));
  totalPayable = computed(() => Number(this.pnl()?.expenses.bills.payable || 0));

  // ─── Chart options ────────────────────────────────────────────

  salesChartOptions = computed<Options>(() => {
    const s = this.sales();
    const dark = this.isDark();
    const gridLine = dark ? '#1f2937' : '#f1f5f9';
    const axisLine = dark ? '#334155' : '#e2e8f0';
    const labelColor = dark ? '#94a3b8' : '#64748b';
    const tooltipBg = dark ? '#0f172a' : '#fff';
    const tooltipText = dark ? '#e2e8f0' : '#0f172a';
    const tooltipBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    const invoiced = new Array(12).fill(0);
    const received = new Array(12).fill(0);
    if (s) {
      for (const m of s.by_month) {
        invoiced[m.month - 1] = Number(m.invoiced || 0);
        received[m.month - 1] = Number(m.received || 0);
      }
    }
    return {
      chart: { type: 'column', backgroundColor: 'transparent', height: 220, style: { fontFamily: 'inherit' } },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { align: 'right', verticalAlign: 'top', symbolRadius: 4, itemStyle: { color: labelColor } },
      accessibility: { enabled: false },
      xAxis: {
        categories: this.monthLabels,
        lineColor: axisLine,
        tickLength: 0,
        labels: { style: { color: labelColor } }
      },
      yAxis: {
        title: { text: undefined },
        gridLineColor: gridLine,
        labels: {
          style: { color: labelColor },
          formatter: function () { return 'RM ' + (Number(this.value) / 1000).toLocaleString() + 'k'; }
        }
      },
      tooltip: {
        shared: true,
        backgroundColor: tooltipBg,
        style: { color: tooltipText },
        borderWidth: 1,
        borderColor: tooltipBorder,
        borderRadius: 8,
        valuePrefix: 'RM ',
        valueDecimals: 2
      },
      plotOptions: {
        column: { borderRadius: 4, pointPadding: 0.1, groupPadding: 0.12, borderWidth: 0 }
      },
      series: [
        { type: 'column', name: 'Invoiced', data: invoiced, color: '#8b5cf6' },
        { type: 'column', name: 'Received', data: received, color: '#f59e0b' }
      ]
    };
  });

  expensesChartOptions = computed<Options>(() => {
    const e = this.expenses();
    const dark = this.isDark();
    const labelColor = dark ? '#cbd5e1' : '#475569';
    const tooltipBg = dark ? '#0f172a' : '#fff';
    const tooltipText = dark ? '#e2e8f0' : '#0f172a';

    const data = (e?.by_category || []).map(row => ({
      name: row.category || 'Uncategorised',
      y: Number(row.paid || 0)
    }));
    return {
      chart: { type: 'pie', backgroundColor: 'transparent', height: 320, style: { fontFamily: 'inherit' } },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: true, align: 'right', verticalAlign: 'middle', layout: 'vertical', itemStyle: { color: labelColor } },
      accessibility: { enabled: false },
      tooltip: {
        backgroundColor: tooltipBg,
        style: { color: tooltipText },
        pointFormat: '<b>RM {point.y:,.2f}</b> ({point.percentage:.1f}%)'
      },
      plotOptions: {
        pie: {
          innerSize: '60%',
          dataLabels: { enabled: true, style: { color: labelColor, textOutline: 'none' }, format: '{point.name}: {point.percentage:.1f}%' },
          colors: ['#8b5cf6', '#f59e0b', '#10b981', '#06b6d4', '#ec4899', '#0ea5e9', '#84cc16', '#f97316']
        }
      },
      series: [{ type: 'pie', name: 'Paid', data }]
    };
  });

  projectPnlChartOptions = computed<Options>(() => {
    const rows = this.projectsPnl().slice(0, 10);
    const dark = this.isDark();
    const gridLine = dark ? '#1f2937' : '#f1f5f9';
    const axisLine = dark ? '#334155' : '#e2e8f0';
    const labelColor = dark ? '#94a3b8' : '#64748b';
    const tooltipBg = dark ? '#0f172a' : '#fff';
    const tooltipText = dark ? '#e2e8f0' : '#0f172a';
    const tooltipBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    return {
      chart: { type: 'bar', backgroundColor: 'transparent', height: Math.max(200, rows.length * 44 + 80), style: { fontFamily: 'inherit' } },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { align: 'right', verticalAlign: 'top', symbolRadius: 4, itemStyle: { color: labelColor } },
      accessibility: { enabled: false },
      xAxis: {
        categories: rows.map(r => r.project.code),
        lineColor: axisLine,
        labels: { style: { color: labelColor } }
      },
      yAxis: {
        title: { text: undefined },
        gridLineColor: gridLine,
        labels: {
          style: { color: labelColor },
          formatter: function () { return 'RM ' + (Number(this.value) / 1000).toLocaleString() + 'k'; }
        }
      },
      tooltip: {
        shared: true,
        valuePrefix: 'RM ',
        valueDecimals: 2,
        backgroundColor: tooltipBg,
        style: { color: tooltipText },
        borderWidth: 1,
        borderColor: tooltipBorder,
        borderRadius: 8
      },
      plotOptions: { bar: { borderRadius: 4, borderWidth: 0 } },
      series: [
        { type: 'bar', name: 'Revenue', data: rows.map(r => Number(r.revenue || 0)), color: '#10b981' },
        { type: 'bar', name: 'Expense', data: rows.map(r => Number(r.expense || 0)), color: '#ef4444' }
      ]
    };
  });

  cashflowChartOptions = computed<Options>(() => {
    const s = this.sales();
    const received = new Array(12).fill(0);
    if (s) for (const m of s.by_month) received[m.month - 1] = Number(m.received || 0);

    // Cumulative receivable balance approximation (running invoiced − received)
    const running: number[] = [];
    let acc = 0;
    if (s) {
      for (let i = 0; i < 12; i++) {
        const row = s.by_month.find(x => x.month === i + 1);
        const invoiced = row ? Number(row.invoiced || 0) : 0;
        const recv = row ? Number(row.received || 0) : 0;
        acc += invoiced - recv;
        running.push(acc);
      }
    } else {
      running.push(...new Array(12).fill(0));
    }

    const dark = this.isDark();
    const gridLine = dark ? '#1f2937' : '#f1f5f9';
    const axisLine = dark ? '#334155' : '#e2e8f0';
    const labelColor = dark ? '#94a3b8' : '#64748b';
    const tooltipBg = dark ? '#0f172a' : '#fff';
    const tooltipText = dark ? '#e2e8f0' : '#0f172a';

    return {
      chart: { type: 'spline', backgroundColor: 'transparent', height: 280, style: { fontFamily: 'inherit' } },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { align: 'right', verticalAlign: 'top', symbolRadius: 4, itemStyle: { color: labelColor } },
      accessibility: { enabled: false },
      xAxis: {
        categories: this.monthLabels,
        lineColor: axisLine,
        tickLength: 0,
        labels: { style: { color: labelColor } }
      },
      yAxis: {
        title: { text: undefined },
        gridLineColor: gridLine,
        labels: {
          style: { color: labelColor },
          formatter: function () { return 'RM ' + (Number(this.value) / 1000).toLocaleString() + 'k'; }
        }
      },
      tooltip: {
        shared: true,
        valuePrefix: 'RM ',
        valueDecimals: 2,
        backgroundColor: tooltipBg,
        style: { color: tooltipText }
      },
      plotOptions: { spline: { marker: { radius: 4 }, lineWidth: 3 } },
      series: [
        { type: 'spline', name: 'Cash received', data: received, color: '#10b981' },
        { type: 'spline', name: 'Outstanding receivables (cum.)', data: running, color: '#8b5cf6', dashStyle: 'ShortDash' }
      ]
    };
  });

  ngOnInit() {
    this.projectService.list({ limit: 100 }).subscribe(res => {
      this.projects.set(res.data.projects);
    });
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    const y = this.year();
    // If no explicit date filter, scope to selected year so it filters every endpoint
    const from = this.fromDate() || (y ? `${y}-01-01` : undefined);
    const to = this.toDate() || (y ? `${y}-12-31` : undefined);
    const opts = {
      project_id: this.selectedProject() || undefined,
      from,
      to
    };

    Promise.all([
      this.financeService.getPnL(opts).toPromise(),
      this.financeService.getProjectsPnl({ from, to }).toPromise(),
      this.financeService.getSales(y, this.selectedProject() || undefined).toPromise(),
      this.financeService.getExpenses(opts).toPromise()
    ]).then(([pnlRes, projRes, salesRes, expRes]) => {
      this.pnl.set(pnlRes?.data || null);
      this.projectsPnl.set(projRes?.data || []);
      this.sales.set(salesRes?.data || null);
      this.expenses.set(expRes?.data || null);
      this.loading.set(false);
    }).catch(() => this.loading.set(false));
  }

  downloadReport() {
    const y = this.year();
    const p = this.pnl();
    const s = this.sales();
    const projects = this.projectsPnl();
    const exp = this.expenses();

    const rows: string[] = [];
    const esc = (v: any) => {
      const str = v == null ? '' : String(v);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const line = (...cols: any[]) => rows.push(cols.map(esc).join(','));

    line(`Finance Report — ${y}`);
    line(`Generated`, new Date().toISOString());
    line('');

    if (p) {
      line('P&L Summary');
      line('Section', 'Metric', 'Amount (RM)');
      line('Sales', 'Invoiced', p.sales.invoiced);
      line('Sales', 'Receivable', p.sales.receivable);
      line('Sales', 'Invoice count', p.sales.count);
      line('Expenses', 'Bills paid', p.expenses.bills.paid);
      line('Expenses', 'Claims paid', p.expenses.claims.paid);
      line('Expenses', 'Payroll net paid', p.expenses.payroll.net_paid);
      line('Realized', 'Revenue', p.realized.revenue);
      line('Realized', 'Expense', p.realized.expense);
      line('Realized', 'Profit', p.realized.profit);
      line('Realized', 'Margin %', p.realized.margin);
      line('Unrealized', 'Revenue (AR)', p.unrealized.revenue);
      line('Unrealized', 'Expense (AP)', p.unrealized.expense);
      line('Unrealized', 'Profit', p.unrealized.profit);
      line('');
    }

    if (s?.by_month?.length) {
      line('Sales by Month');
      line('Month', 'Invoiced', 'Received');
      for (const m of s.by_month) {
        line(this.monthLabels[m.month - 1], m.invoiced, m.received);
      }
      line('');
    }

    if (projects.length) {
      line('Projects P&L');
      line('Code', 'Name', 'Revenue', 'Expense', 'Realized profit', 'Receivable (AR)', 'Payable (AP)', 'Unrealized profit');
      for (const r of projects) {
        line(r.project.code, r.project.name, r.revenue, r.expense, r.realized_profit, r.receivable, r.payable, r.unrealized_profit);
      }
      line('');
    }

    if (exp?.by_category?.length) {
      line('Expenses by Category');
      line('Category', 'Paid');
      for (const c of exp.by_category) {
        line(c.category || 'Uncategorised', c.paid);
      }
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${y}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  formatMoney(v: number | null | undefined): string {
    if (v == null) return '—';
    return `RM ${(+v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  parseDate(s: string): Date | null {
    return s ? new Date(s) : null;
  }

  onFromDate(d: Date | null) {
    this.fromDate.set(d ? d.toISOString().slice(0, 10) : '');
    this.refresh();
  }

  onToDate(d: Date | null) {
    this.toDate.set(d ? d.toISOString().slice(0, 10) : '');
    this.refresh();
  }
}
