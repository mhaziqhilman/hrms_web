import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { LeaveUtilizationAnalytics, MONTH_SHORT_NAMES } from '../../models/analytics.model';

@Component({
  selector: 'app-leave-utilization-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Leave by Type Doughnut Chart -->
      <div class="bg-card rounded-lg border p-4">
        <h3 class="text-lg font-semibold mb-4">Leave by Type</h3>
        @if (typeChartData.datasets[0].data.length > 0) {
          <canvas baseChart
            [data]="typeChartData"
            [options]="doughnutChartOptions"
            [type]="'doughnut'">
          </canvas>
        } @else {
          <div class="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        }
      </div>

      <!-- Monthly Trend Line Chart -->
      <div class="bg-card rounded-lg border p-4">
        <h3 class="text-lg font-semibold mb-4">Monthly Leave Trend</h3>
        @if (monthlyChartData.datasets[0].data.length > 0) {
          <canvas baseChart
            [data]="monthlyChartData"
            [options]="lineChartOptions"
            [type]="'line'">
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
export class LeaveUtilizationChartComponent implements OnChanges {
  @Input() data: LeaveUtilizationAnalytics | null = null;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  typeChartData: ChartData<'doughnut'> = {
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
        borderWidth: 2
      }
    ]
  };

  monthlyChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Leave Days',
        data: [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
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
            return `${context.label}: ${value} days`;
          }
        }
      }
    }
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Days'
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

    // Update leave type chart
    this.typeChartData = {
      labels: this.data.by_type.map(t => t.leave_type),
      datasets: [
        {
          ...this.typeChartData.datasets[0],
          data: this.data.by_type.map(t => t.total_days)
        }
      ]
    };

    // Update monthly chart
    this.monthlyChartData = {
      labels: this.data.by_month.map(m => MONTH_SHORT_NAMES[m.month - 1]),
      datasets: [
        {
          ...this.monthlyChartData.datasets[0],
          data: this.data.by_month.map(m => m.total_days)
        }
      ]
    };

    this.chart?.update();
  }
}
