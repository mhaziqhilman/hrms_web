import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { HighchartsChartComponent } from 'highcharts-angular';
import type { Options } from 'highcharts';

import { CashFlowService } from '../../services/cashflow.service';
import { CashFlowStatement, CashFlowLine, CashFlowMonth, CashFlowSection } from '../../models/cashflow.model';
import { ProjectService } from '@/features/projects/services/project.service';
import { Project } from '@/features/projects/models/project.model';
import { ThemeService } from '@/core/services/theme';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardSegmentedComponent, SegmentedOption } from '@/shared/components/segmented/segmented.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

interface ComputedTotals {
  inflowByMonth: number[];
  outflowByMonth: number[];
  net: number[];
  opening: number[];
  closing: number[];
  inflowTotal: number;
  outflowTotal: number;
  netTotal: number;
  closingFinal: number;
}

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

@Component({
  selector: 'app-cashflow-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HighchartsChartComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardInputDirective,
    ZardSegmentedComponent
  ],
  templateUrl: './cashflow-editor.component.html'
})
export class CashFlowEditorComponent implements OnInit {
  private service = inject(CashFlowService);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alertDialog = inject(ZardAlertDialogService);
  private themeService = inject(ThemeService);
  isDark = this.themeService.darkMode;

  loading = signal(true);
  saving = signal(false);
  pulling = signal(false);
  dirty = signal(false);
  publicId = '';

  // header
  title = signal('');
  status = signal<'Draft' | 'Final'>('Draft');
  currency = signal('MYR');
  openingBalance = signal(0);

  // grid data (plain arrays; edits bump `rev` to recompute)
  months: CashFlowMonth[] = [];
  inflowLines: CashFlowLine[] = [];
  outflowLines: CashFlowLine[] = [];
  private rev = signal(0);

  // view
  view = signal<'projected' | 'actual'>('projected');
  showActualsAvailable = signal(false);
  projects = signal<Project[]>([]);

  viewOptions: SegmentedOption[] = [
    { label: 'Projected', value: 'projected' },
    { label: 'Actual', value: 'actual' }
  ];

  sourceOptions = [
    { value: 'manual', label: 'Manual' },
    { value: 'invoice', label: 'Invoices (received)' },
    { value: 'bill', label: 'Bills (paid)' },
    { value: 'payroll', label: 'Payroll (paid)' },
    { value: 'claim', label: 'Claims (paid)' }
  ];

  ngOnInit() {
    this.publicId = this.route.snapshot.paramMap.get('id') || '';
    this.projectService.list({ limit: 100 }).subscribe({
      next: (res) => this.projects.set(res?.data?.projects || []),
      error: () => {}
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.service.get(this.publicId).subscribe({
      next: (res) => {
        if (res.success) this.hydrate(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private hydrate(s: CashFlowStatement) {
    this.title.set(s.title);
    this.status.set(s.status);
    this.currency.set(s.currency);
    this.openingBalance.set(Number(s.opening_balance));
    this.months = s.months;
    this.inflowLines = (s.inflow_lines || []).map(l => this.normalizeLine(l, s.num_months));
    this.outflowLines = (s.outflow_lines || []).map(l => this.normalizeLine(l, s.num_months));
    this.showActualsAvailable.set([...this.inflowLines, ...this.outflowLines].some(l => l.actuals != null));
    this.dirty.set(false);
    this.rev.update(v => v + 1);
  }

  private normalizeLine(l: CashFlowLine, n: number): CashFlowLine {
    const amounts = Array.from({ length: n }, (_, i) => round2(l.amounts?.[i] ?? 0));
    const actuals = l.actuals ? Array.from({ length: n }, (_, i) => round2(l.actuals![i] ?? 0)) : null;
    return { ...l, amounts, actuals };
  }

  // ── editing ──
  bump() { this.rev.update(v => v + 1); this.dirty.set(true); }

  // Returns the array the cell binds to. In actual view we lazily materialise
  // `line.actuals` so manual edits persist (e.g. a medical claim paid outside
  // the Claims module). Pull-actuals later overwrites only non-manual lines.
  cellArray(line: CashFlowLine): number[] {
    if (this.view() === 'actual') {
      if (!line.actuals) line.actuals = new Array(this.months.length).fill(0);
      return line.actuals;
    }
    return line.amounts;
  }

  // Make sure every line has an actuals array before showing the actual grid.
  private ensureActuals() {
    const n = this.months.length;
    for (const l of [...this.inflowLines, ...this.outflowLines]) {
      if (!l.actuals) l.actuals = new Array(n).fill(0);
    }
  }

  setView(v: string) {
    const view = v === 'actual' ? 'actual' : 'projected';
    if (view === 'actual') this.ensureActuals();
    this.view.set(view);
  }

  onLineMeta() { this.bump(); }

  addLine(section: CashFlowSection) {
    const n = this.months.length;
    const line: CashFlowLine = {
      section,
      label: '',
      sort_order: (section === 'inflow' ? this.inflowLines : this.outflowLines).length,
      source: 'manual',
      amounts: new Array(n).fill(0),
      // Pre-fill actuals when adding while viewing the actual grid.
      actuals: this.view() === 'actual' ? new Array(n).fill(0) : null
    };
    if (section === 'inflow') this.inflowLines = [...this.inflowLines, line];
    else this.outflowLines = [...this.outflowLines, line];
    this.bump();
  }

  removeLine(section: CashFlowSection, index: number) {
    if (section === 'inflow') this.inflowLines = this.inflowLines.filter((_, i) => i !== index);
    else this.outflowLines = this.outflowLines.filter((_, i) => i !== index);
    this.bump();
  }

  rowTotal(line: CashFlowLine): number {
    return round2(this.cellArray(line).reduce((s, v) => s + (Number(v) || 0), 0));
  }

  // ── computed totals (live) ──
  totals = computed<ComputedTotals>(() => {
    this.rev();
    const n = this.months.length;
    const arr = (lines: CashFlowLine[]) => {
      const out = new Array(n).fill(0);
      for (const l of lines) {
        const src = this.view() === 'actual' ? (l.actuals ?? []) : l.amounts;
        for (let i = 0; i < n; i++) out[i] = round2(out[i] + (Number(src[i]) || 0));
      }
      return out;
    };
    const inflowByMonth = arr(this.inflowLines);
    const outflowByMonth = arr(this.outflowLines);
    const net = new Array(n).fill(0);
    const opening = new Array(n).fill(0);
    const closing = new Array(n).fill(0);
    const ob = Number(this.openingBalance()) || 0;
    for (let i = 0; i < n; i++) {
      net[i] = round2(inflowByMonth[i] - outflowByMonth[i]);
      opening[i] = i === 0 ? round2(ob) : closing[i - 1];
      closing[i] = round2(opening[i] + net[i]);
    }
    const sum = (a: number[]) => round2(a.reduce((s, v) => s + v, 0));
    return {
      inflowByMonth, outflowByMonth, net, opening, closing,
      inflowTotal: sum(inflowByMonth),
      outflowTotal: sum(outflowByMonth),
      netTotal: sum(net),
      closingFinal: closing[n - 1] ?? round2(ob)
    };
  });

  // ── actions ──
  private headerPayload() {
    return {
      title: this.title(),
      opening_balance: Number(this.openingBalance()) || 0,
      status: this.status(),
      currency: this.currency()
    };
  }

  // Sends both projected (amounts) and actual figures so manual actual edits
  // round-trip and aren't lost when the statement reloads.
  private linesPayload(): CashFlowLine[] {
    return [...this.inflowLines, ...this.outflowLines].map((l, i) => ({
      public_id: l.public_id,
      section: l.section,
      label: l.label || 'Untitled',
      source: l.source,
      source_ref: l.source_ref || null,
      sort_order: l.sort_order ?? i,
      amounts: l.amounts,
      actuals: l.actuals ?? null
    }));
  }

  save() {
    this.saving.set(true);
    this.service.update(this.publicId, this.headerPayload()).pipe(
      switchMap(() => this.service.saveLines(this.publicId, this.linesPayload()))
    ).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) this.hydrate(res.data);
      },
      error: () => this.saving.set(false)
    });
  }

  pullActuals() {
    this.pulling.set(true);
    const run = () => this.service.pullActuals(this.publicId).subscribe({
      next: (res) => {
        this.pulling.set(false);
        if (res.success) { this.hydrate(res.data); this.view.set('actual'); }
      },
      error: () => this.pulling.set(false)
    });

    if (this.dirty()) {
      // Persist edits (projected + manual actuals) first so the reload keeps them.
      this.service.update(this.publicId, this.headerPayload()).pipe(
        switchMap(() => this.service.saveLines(this.publicId, this.linesPayload()))
      ).subscribe({ next: () => run(), error: () => { this.pulling.set(false); } });
    } else {
      run();
    }
  }

  exporting = signal(false);

  exportPdf() {
    if (this.exporting()) return;
    this.exporting.set(true);
    const view = this.view();

    const font = this.themeService.fontFamily();
    const download = () => this.service.downloadPdf(this.publicId, view, font).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safe = (this.title() || 'cash-flow').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
        a.download = `${safe || 'cash-flow'}-${view}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.exporting.set(false)
    });

    // PDF is rendered from saved data — flush pending edits first so they appear.
    if (this.dirty()) {
      this.service.update(this.publicId, this.headerPayload()).pipe(
        switchMap(() => this.service.saveLines(this.publicId, this.linesPayload()))
      ).subscribe({
        next: (res) => { if (res.success) { this.hydrate(res.data); } download(); },
        error: () => this.exporting.set(false)
      });
    } else {
      download();
    }
  }

  toggleStatus() {
    this.status.update(s => s === 'Final' ? 'Draft' : 'Final');
    this.bump();
  }

  back() { this.router.navigate(['/finance/cashflow']); }

  money(v: number): string {
    return Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── chart ──
  chartOptions = computed<Options>(() => {
    this.rev();
    const t = this.totals();
    const dark = this.isDark();
    const text = dark ? '#e5e7eb' : '#374151';
    const grid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    return {
      chart: { type: 'column', backgroundColor: 'transparent', height: 320, style: { fontFamily: 'inherit' } },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { itemStyle: { color: text } },
      xAxis: {
        categories: this.months.map(m => m.label),
        labels: { style: { color: text, fontSize: '10px' } },
        lineColor: grid, tickColor: grid
      },
      yAxis: {
        title: { text: undefined },
        gridLineColor: grid,
        labels: { style: { color: text } }
      },
      tooltip: { shared: true, valuePrefix: `${this.currency()} ` },
      plotOptions: { column: { borderRadius: 2 } },
      series: [
        { type: 'column', name: 'Inflows', data: t.inflowByMonth, color: '#10b981' },
        { type: 'column', name: 'Outflows', data: t.outflowByMonth, color: '#f43f5e' },
        { type: 'spline', name: 'Closing balance', data: t.closing, color: dark ? '#60a5fa' : '#2563eb', marker: { enabled: false } }
      ]
    };
  });
}
