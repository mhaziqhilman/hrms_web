import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { PayrollCostAnalytics, MONTH_SHORT_NAMES } from '../../models/analytics.model';

@Component({
  selector: 'app-payroll-cost-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Monthly Bar Chart -->
      <div class="bg-card rounded-lg border p-4">
        <h3 class="text-lg font-semibold mb-4">Monthly Payroll Cost</h3>
        @if (monthlyChartData.datasets[0].data.length > 0) {
          <canvas baseChart
            [data]="monthlyChartData"
            [options]="barChartOptions"
            [type]="'bar'">
          </canvas>
        } @else {
          <div class="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        }
      </div>

      <!-- Department Pie Chart -->
      <div class="bg-card rounded-lg border p-4">
        <h3 class="text-lg font-semibold mb-4">Payroll by Department</h3>
        @if (departmentChartData.datasets[0].data.length > 0) {
          <canvas baseChart
            [data]="departmentChartData"
            [options]="pieChartOptions"
            [type]="'pie'">
          </canvas>
        } @else {
          <div class="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        }
      </div>
    </div>
  `
})
export class PayrollCostChartComponent implements OnChanges {
  @Input() data: PayrollCostAnalytics | null = null;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  monthlyChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Gross Salary',
        data: [],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Net Salary',
        data: [],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  };

  departmentChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(20, 184, 166, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: RM ${value?.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `RM ${Number(value).toLocaleString('en-MY')}`
        }
      }
    }
  };

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'right'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            return `${context.label}: RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.updateCharts();
    }
  }

  private updateCharts(): void {
    if (!this.data) return;

    // Update monthly chart
    this.monthlyChartData = {
      labels: this.data.by_month.map(m => MONTH_SHORT_NAMES[m.month - 1]),
      datasets: [
        {
          ...this.monthlyChartData.datasets[0],
          data: this.data.by_month.map(m => m.total_gross)
        },
        {
          ...this.monthlyChartData.datasets[1],
          data: this.data.by_month.map(m => m.total_net)
        }
      ]
    };

    // Update department chart
    this.departmentChartData = {
      labels: this.data.by_department.map(d => d.department),
      datasets: [
        {
          ...this.departmentChartData.datasets[0],
          data: this.data.by_department.map(d => d.total_gross)
        }
      ]
    };

    this.chart?.update();
  }
}
