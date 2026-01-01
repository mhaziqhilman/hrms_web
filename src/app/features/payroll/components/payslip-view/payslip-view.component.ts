import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PayrollService } from '../../services/payroll.service';
import { Payslip, MONTH_NAMES } from '../../models/payroll.model';

// ZardUI Component Imports
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';

@Component({
  selector: 'app-payslip-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardButtonComponent,
    ZardIconComponent,
    ZardCardComponent
  ],
  templateUrl: './payslip-view.component.html',
  styleUrl: './payslip-view.component.css'
})
export class PayslipViewComponent implements OnInit {
  payslip = signal<Payslip | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  downloading = signal(false);

  // Constants
  MONTH_NAMES = MONTH_NAMES;

  constructor(
    private payrollService: PayrollService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPayslip(Number(id));
    }
  }

  loadPayslip(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.payrollService.getPayslip(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.payslip.set(response.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load payslip');
        this.loading.set(false);
        console.error('Error loading payslip:', err);
      }
    });
  }

  downloadPayslip(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.downloading.set(true);

    this.payrollService.downloadPayslip(Number(id)).subscribe({
      next: (blob) => {
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const payslip = this.payslip();
        const filename = payslip
          ? `Payslip_${payslip.employee.employee_id}_${payslip.pay_period.year}_${payslip.pay_period.month}.pdf`
          : `Payslip_${id}.pdf`;

        link.download = filename;
        link.click();

        window.URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: (err) => {
        alert('Failed to download payslip. PDF generation may not be implemented yet.');
        this.downloading.set(false);
        console.error('Error downloading payslip:', err);
      }
    });
  }

  printPayslip(): void {
    window.print();
  }

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RM 0.00';
    }
    return `RM ${numAmount.toFixed(2)}`;
  }

  getMonthName(month: number): string {
    return MONTH_NAMES[month - 1];
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
