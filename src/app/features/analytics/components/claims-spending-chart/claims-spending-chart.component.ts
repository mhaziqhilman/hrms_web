import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ClaimsSpendingAnalytics, MONTH_SHORT_NAMES } from '../../models/analytics.model';

@Component({
  selector: 'app-claims-spending-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Claims by Type Bar Chart -->
      <div class="bg-card rounded-lg border p-4">
        <h3 class="text-lg font-semibold mb-4">Claims by Type</h3>
        @if (typeChartData.datasets[0].data.length > 0) {
          <canvas baseChart
            [data]="typeChartData"
            [options]="barChartOptions"
            [type]="'bar'">
          </canvas>
        } @else {
          <div class="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        }
      </div>

      <!-- Monthly Spending Line Chart -->
      <div class="bg-card rounded-lg border p-4">
        <h3 class="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
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

      <!-- Department Distribution -->
      <div class="bg-card rounded-lg border p-4">
        <h3 class="text-lg font-semibold mb-4">Claims by Department</h3>
        @if (departmentChartData.datasets[0].data.length > 0) {
          <canvas baseChart
            [data]="departmentChartData"
            [options]="horizontalBarOptions"
            [type]="'bar'">
          </canvas>
        } @else {
          <div class="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        }
      </div>

      <!-- Status Breakdown -->
      <div class="bg-card rounded-lg border p-4">
        <h3 class="text-lg font-semibold mb-4">Claims Status</h3>
        @if (statusChartData.datasets[0].data.length > 0) {
          <canvas baseChart
            [data]="statusChartData"
            [options]="doughnutChartOptions"
            [type]="'doughnut'">
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
export class ClaimsSpendingChartComponent implements OnChanges {
  @Input() data: ClaimsSpendingAnalytics | null = null;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  typeChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Total Amount (RM)',
        data: [],
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1
      }
    ]
  };

  monthlyChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Total Spending',
        data: [],
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  departmentChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Amount (RM)',
        data: [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(20, 184, 166, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };

  statusChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(245, 158, 11, 0.7)',  // Pending - Yellow
          'rgba(59, 130, 246, 0.7)',  // Manager Approved - Blue
          'rgba(34, 197, 94, 0.7)',   // Finance Approved - Green
          'rgba(239, 68, 68, 0.7)',   // Rejected - Red
          'rgba(168, 85, 247, 0.7)'   // Paid - Purple
        ],
        borderWidth: 2
      }
    ]
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `RM ${value?.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
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

  lineChartOptions: ChartConfiguration['options'] = {
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
            return `RM ${value?.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
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

  horizontalBarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.x;
            return `RM ${value?.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `RM ${Number(value).toLocaleString('en-MY')}`
        }
      }
    }
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
            return `${context.label}: ${value} claims`;
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

    // Update type chart
    this.typeChartData = {
      labels: this.data.by_type.map(t => t.claim_type),
      datasets: [
        {
          ...this.typeChartData.datasets[0],
          data: this.data.by_type.map(t => t.total_amount)
        }
      ]
    };

    // Update monthly chart
    this.monthlyChartData = {
      labels: this.data.by_month.map(m => MONTH_SHORT_NAMES[m.month - 1]),
      datasets: [
        {
          ...this.monthlyChartData.datasets[0],
          data: this.data.by_month.map(m => m.total_amount)
        }
      ]
    };

    // Update department chart
    this.departmentChartData = {
      labels: this.data.by_department.map(d => d.department),
      datasets: [
        {
          ...this.departmentChartData.datasets[0],
          data: this.data.by_department.map(d => d.total_amount)
        }
      ]
    };

    // Update status chart
    const statusLabels: { [key: string]: string } = {
      'Pending': 'Pending',
      'Manager_Approved': 'Manager Approved',
      'Finance_Approved': 'Finance Approved',
      'Rejected': 'Rejected',
      'Paid': 'Paid'
    };

    this.statusChartData = {
      labels: this.data.by_status.map(s => statusLabels[s.status] || s.status),
      datasets: [
        {
          ...this.statusChartData.datasets[0],
          data: this.data.by_status.map(s => s.count)
        }
      ]
    };

    this.chart?.update();
  }
}
