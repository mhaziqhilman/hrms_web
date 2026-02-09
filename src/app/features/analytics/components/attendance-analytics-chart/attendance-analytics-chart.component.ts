import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { AttendancePunctualityAnalytics, MONTH_SHORT_NAMES } from '../../models/analytics.model';

@Component({
  selector: 'app-attendance-analytics-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Punctuality Trend -->
      <div class="bg-card rounded-lg border p-4">
        <h3 class="text-lg font-semibold mb-4">Punctuality Trend</h3>
        @if (trendChartData.datasets[0].data.length > 0) {
          <canvas baseChart
            [data]="trendChartData"
            [options]="lineChartOptions"
            [type]="'line'">
          </canvas>
        } @else {
          <div class="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        }
      </div>

      <!-- Department Punctuality Bar Chart -->
      <div class="bg-card rounded-lg border p-4">
        <h3 class="text-lg font-semibold mb-4">Punctuality by Department</h3>
        @if (departmentChartData.datasets[0].data.length > 0) {
          <canvas baseChart
            [data]="departmentChartData"
            [options]="barChartOptions"
            [type]="'bar'">
          </canvas>
        } @else {
          <div class="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        }
      </div>

      <!-- Work Type Distribution -->
      <div class="bg-card rounded-lg border p-4">
        <h3 class="text-lg font-semibold mb-4">Work Type Distribution</h3>
        @if (workTypeChartData.datasets[0].data.length > 0) {
          <canvas baseChart
            [data]="workTypeChartData"
            [options]="pieChartOptions"
            [type]="'pie'">
          </canvas>
        } @else {
          <div class="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        }
      </div>

      <!-- Summary Stats -->
      <div class="bg-card rounded-lg border p-4">
        <h3 class="text-lg font-semibold mb-4">Summary Statistics</h3>
        @if (data) {
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-muted/30 rounded-lg">
              <div class="text-2xl font-bold text-primary">{{ data.summary.punctuality_rate }}%</div>
              <div class="text-sm text-muted-foreground">Punctuality Rate</div>
            </div>
            <div class="p-4 bg-muted/30 rounded-lg">
              <div class="text-2xl font-bold text-destructive">{{ data.summary.late_count }}</div>
              <div class="text-sm text-muted-foreground">Late Arrivals</div>
            </div>
            <div class="p-4 bg-muted/30 rounded-lg">
              <div class="text-2xl font-bold">{{ data.summary.avg_working_hours }}</div>
              <div class="text-sm text-muted-foreground">Avg Working Hours</div>
            </div>
            <div class="p-4 bg-muted/30 rounded-lg">
              <div class="text-2xl font-bold">{{ data.summary.total_records }}</div>
              <div class="text-sm text-muted-foreground">Total Records</div>
            </div>
          </div>
        } @else {
          <div class="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        }
      </div>
    </div>
  `
})
export class AttendanceAnalyticsChartComponent implements OnChanges {
  @Input() data: AttendancePunctualityAnalytics | null = null;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  trendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'On Time',
        data: [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Late',
        data: [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  departmentChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Punctuality Rate (%)',
        data: [],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  workTypeChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(34, 197, 94, 0.7)'
        ],
        borderWidth: 2
      }
    ]
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
          text: 'Count'
        }
      }
    }
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`
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

    // Update trend chart
    const labels = this.data.trend.map(t =>
      t.date ? t.date : MONTH_SHORT_NAMES[(t.month || 1) - 1]
    );
    const onTimeData = this.data.trend.map(t => t.total_records - t.late_count);
    const lateData = this.data.trend.map(t => t.late_count);

    this.trendChartData = {
      labels,
      datasets: [
        { ...this.trendChartData.datasets[0], data: onTimeData },
        { ...this.trendChartData.datasets[1], data: lateData }
      ]
    };

    // Update department chart
    this.departmentChartData = {
      labels: this.data.by_department.map(d => d.department),
      datasets: [
        {
          ...this.departmentChartData.datasets[0],
          data: this.data.by_department.map(d => d.punctuality_rate)
        }
      ]
    };

    // Update work type chart
    this.workTypeChartData = {
      labels: this.data.by_work_type.map(w => w.type),
      datasets: [
        {
          ...this.workTypeChartData.datasets[0],
          data: this.data.by_work_type.map(w => w.count)
        }
      ]
    };

    this.chart?.update();
  }
}
