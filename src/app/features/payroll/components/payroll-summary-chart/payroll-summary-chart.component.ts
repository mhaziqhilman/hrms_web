import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighchartsChartComponent } from 'highcharts-angular';
import type { Options, PointOptionsObject } from 'highcharts';
import { PayrollCostAnalytics, MONTH_SHORT_NAMES } from '../../../analytics/models/analytics.model';

@Component({
  selector: 'app-payroll-summary-chart',
  standalone: true,
  imports: [CommonModule, HighchartsChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payroll-summary-chart.component.html',
  styleUrl: './payroll-summary-chart.component.css'
})
export class PayrollSummaryChartComponent {
  analytics = input<PayrollCostAnalytics | null>(null);
  year = input<number>(new Date().getFullYear());

  private monthlyGross = computed<number[]>(() => {
    const data = new Array(12).fill(0);
    const a = this.analytics();
    if (!a) return data;
    for (const m of a.by_month) {
      data[m.month - 1] = Number(m.total_gross || 0);
    }
    return data;
  });

  totalGross = computed(() =>
    this.monthlyGross().reduce((sum, v) => sum + v, 0)
  );

  latestStat = computed(() => {
    const data = this.monthlyGross();
    let lastIdx = -1;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i] > 0) { lastIdx = i; break; }
    }
    if (lastIdx === -1) return { month: '', value: 0, percent: 0 };
    const latest = data[lastIdx];
    const prev = lastIdx > 0 ? data[lastIdx - 1] : 0;
    const percent = prev > 0 ? ((latest - prev) / prev) * 100 : 0;
    return { month: MONTH_SHORT_NAMES[lastIdx], value: latest, percent };
  });

  formatCurrency(n: number): string {
    return n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  chartOptions = computed<Options>(() => {
    const gross = this.monthlyGross();
    const latestIdx = (() => {
      for (let i = gross.length - 1; i >= 0; i--) if (gross[i] > 0) return i;
      return -1;
    })();

    const seriesData: PointOptionsObject[] = gross.map((y, i) => ({
      y,
      marker: i === latestIdx
        ? { enabled: true, radius: 6, fillColor: '#ec4899', lineColor: '#fff', lineWidth: 3 }
        : { enabled: true, radius: 4, fillColor: '#fff', lineColor: '#ec4899', lineWidth: 2 }
    }));

    return {
      chart: {
        type: 'areaspline',
        backgroundColor: 'transparent',
        height: 80,
        style: { fontFamily: 'inherit' },
        spacing: [0, 8, 0, 8]
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      accessibility: { enabled: false },
      xAxis: {
        categories: [...MONTH_SHORT_NAMES],
        lineColor: 'transparent',
        tickLength: 0,
        labels: {
          style: { color: 'var(--muted-foreground, #64748b)', fontSize: '12px' }
        }
      },
      yAxis: {
        title: { text: undefined },
        gridLineColor: 'transparent',
        labels: { enabled: false }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 12,
        shadow: {
          color: 'rgba(15, 23, 42, 0.08)',
          offsetX: 0,
          offsetY: 4,
          width: 12,
          opacity: 1
        },
        useHTML: true,
        padding: 0,
        style: { color: '#0f172a', fontSize: '12px' },
        formatter: function () {
          const y = typeof this.y === 'number' ? this.y : 0;
          const idx = (this as any).point?.index ?? 0;
          const series = (this as any).series?.data as Array<{ y: number }> | undefined;
          const prev = series && idx > 0 ? series[idx - 1].y : 0;
          const pct = prev > 0 ? ((y - prev) / prev) * 100 : 0;
          const pctStr = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
          const pctColor = pct >= 0 ? '#10b981' : '#ef4444';
          const arrow = pct >= 0 ? '↗' : '↘';
          const valStr = 'RM ' + y.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          return `
            <div style="padding:10px 14px;min-width:140px;">
              <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Payroll</div>
              <div style="display:flex;align-items:center;gap:10px;">
                <strong style="font-size:14px;color:#0f172a;">${valStr}</strong>
                <span style="font-size:11px;font-weight:600;color:${pctColor};">${arrow} ${pctStr}</span>
              </div>
            </div>`;
        }
      },
      plotOptions: {
        areaspline: {
          lineWidth: 3,
          lineColor: '#ec4899',
          fillOpacity: 1,
          states: {
            hover: { lineWidth: 3, halo: { size: 0 } },
            inactive: { opacity: 1 }
          }
        },
        series: {
          states: { inactive: { opacity: 1 } },
          marker: { symbol: 'circle' }
        }
      },
      series: [{
        type: 'areaspline',
        name: 'Payroll',
        data: seriesData,
        color: '#ec4899',
        fillColor: {
          linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
          stops: [
            [0, 'rgba(236, 72, 153, 0.22)'],
            [1, 'rgba(236, 72, 153, 0)']
          ]
        }
      }]
    };
  });
}
