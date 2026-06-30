import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatutoryReportsService } from '../../services/statutory-reports.service';
import { StatutorySummaryData, MONTHS } from '../../models/statutory-reports.model';

// ZardUI Components
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';

@Component({
  selector: 'app-statutory-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardIconComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardBadgeComponent
  ],
  templateUrl: './statutory-summary.component.html'
})
export class StatutorySummaryComponent implements OnInit {
  private reportsService = inject(StatutoryReportsService);

  MONTHS = MONTHS;

  loading = signal(false);
  error = signal<string | null>(null);

  availableYears = signal<number[]>([]);
  selectedYear = signal<number | null>(null);

  summary = signal<StatutorySummaryData | null>(null);

  // True once we've loaded and there's simply no payroll data for the year
  hasData = computed(() => {
    const s = this.summary();
    return !!s && s.months.length > 0;
  });

  ngOnInit(): void {
    this.loadPeriods();
  }

  private loadPeriods(): void {
    this.reportsService.getAvailablePeriods().subscribe({
      next: (response) => {
        if (response.success) {
          const years = Object.keys(response.data).map(Number).sort((a, b) => b - a);
          this.availableYears.set(years);
          if (years.length > 0) {
            this.selectedYear.set(years[0]);
            this.loadSummary();
          }
        }
      },
      error: () => this.error.set('Failed to load available periods')
    });
  }

  onYearSelect(value: number): void {
    this.selectedYear.set(value);
    this.loadSummary();
  }

  loadSummary(): void {
    const year = this.selectedYear();
    if (!year) return;

    this.loading.set(true);
    this.error.set(null);
    this.summary.set(null);

    this.reportsService.getStatutorySummary(year).subscribe({
      next: (response) => {
        if (response.success) {
          this.summary.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load statutory summary');
        this.loading.set(false);
      }
    });
  }

  getMonthName(month: number): string {
    return this.MONTHS.find(m => m.value === month)?.label || '';
  }

  /** Short month label e.g. "Jan" for table headers */
  getMonthShort(month: number): string {
    return this.getMonthName(month).slice(0, 3);
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return 'RM 0.00';
    return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  /** Compact figure for cards e.g. RM 12,345 (no cents) */
  formatCompact(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return 'RM 0';
    return `RM ${Math.round(amount).toLocaleString('en-MY')}`;
  }
}
