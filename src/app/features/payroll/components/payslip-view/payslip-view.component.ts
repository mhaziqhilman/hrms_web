import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PayrollService } from '../../services/payroll.service';
import { Payslip, MONTH_NAMES } from '../../models/payroll.model';
import { DisplayService } from '@/core/services/display.service';
import { toast } from 'ngx-sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
  payrollPublicId = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  downloading = signal(false);
  sendingEmail = signal(false);

  MONTH_NAMES = MONTH_NAMES;
  private displayService = inject(DisplayService);

  constructor(
    private payrollService: PayrollService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.payrollPublicId.set(id);
      this.loadPayslip(id);
    }
  }

  loadPayslip(id: string): void {
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

  /** Generate PDF blob from the rendered payslip HTML via clean iframe */
  private async generatePdfBlob(): Promise<Blob> {
    const el = document.querySelector('.payslip') as HTMLElement;
    if (!el) throw new Error('Payslip element not found');

    // Render in a clean iframe — no Tailwind, no oklch
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;height:auto;border:none;';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument!;
    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html><html><head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${GOOGLE_FONTS_URL}" rel="stylesheet">
<style>${PAYSLIP_PRINT_CSS}</style>
</head><body>${el.outerHTML}</body></html>`);
    iframeDoc.close();

    await new Promise<void>(resolve => { iframe.onload = () => resolve(); });
    await iframeDoc.fonts.ready;

    const target = iframeDoc.querySelector('.payslip') as HTMLElement;
    const canvas = await html2canvas(target, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 800
    });

    iframe.remove();

    const imgData = canvas.toDataURL('image/jpeg', 1);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 5;
    const usableWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    if (imgHeight <= pageHeight - margin * 2) {
      pdf.addImage(imgData, 'JPEG', margin, margin, usableWidth, imgHeight);
    } else {
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      const pxPerPage = ((pageHeight - margin * 2) / usableWidth) * canvas.width;
      let yOffset = 0;
      let page = 0;

      while (yOffset < canvas.height) {
        const sliceHeight = Math.min(pxPerPage, canvas.height - yOffset);
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, sliceHeight);
        ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        const pageImg = pageCanvas.toDataURL('image/jpeg', 0.85);
        const pageImgHeight = (sliceHeight * usableWidth) / canvas.width;

        if (page > 0) pdf.addPage();
        pdf.addImage(pageImg, 'JPEG', margin, margin, usableWidth, pageImgHeight);

        yOffset += sliceHeight;
        page++;
      }
    }

    return pdf.output('blob');
  }

  async downloadPayslip(): Promise<void> {
    this.downloading.set(true);
    try {
      const blob = await this.generatePdfBlob();
      const p = this.payslip()!;
      const fileName = `Payslip - ${this.getMonthName(p.pay_period.month)} ${p.pay_period.year} (${p.employee.full_name}).pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF');
    } finally {
      this.downloading.set(false);
    }
  }

  printPayslip(): void {
    const el = document.querySelector('.payslip') as HTMLElement;
    if (!el) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Payslip</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${GOOGLE_FONTS_URL}" rel="stylesheet">
<style>
${PAYSLIP_PRINT_CSS}
</style></head><body>${el.outerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  /** Format number as comma-separated with 2 decimals (no RM prefix) */
  fmtAmt(amount: number | string | null | undefined): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num === null || num === undefined || isNaN(num)) return '0.00';
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  formatCurrency(amount: number | string | null | undefined): string {
    return `RM ${this.fmtAmt(amount)}`;
  }

  getMonthName(month: number): string {
    return MONTH_NAMES[month - 1];
  }

  formatDate(date: string | Date): string {
    return this.displayService.formatDate(date);
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').filter(w => w.length > 0).map(w => w[0]).join('').toUpperCase().slice(0, 3);
  }

  getDividerGradient(): string {
    const p = this.payslip();
    const primary = p?.company?.primary_color || '#6b21a8';
    const secondary = p?.company?.secondary_color || '#0891b2';
    return `linear-gradient(to right, ${primary}, ${secondary})`;
  }

  totalContributions(): number {
    const p = this.payslip();
    if (!p) return 0;
    return (
      (p.employer_contributions.epf_employer || 0) +
      (p.employer_contributions.socso_employer || 0) +
      (p.employer_contributions.eis_employer || 0)
    );
  }

  amountInWords(amount: number): string {
    if (!amount || isNaN(amount)) return 'Ringgit Malaysia Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertGroup = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertGroup(n % 100) : '');
    };

    const ringgit = Math.floor(amount);
    const sen = Math.round((amount - ringgit) * 100);

    let result = 'Ringgit Malaysia ';

    if (ringgit === 0) {
      result += 'Zero';
    } else {
      const millions = Math.floor(ringgit / 1000000);
      const thousands = Math.floor((ringgit % 1000000) / 1000);
      const remainder = ringgit % 1000;

      if (millions) result += convertGroup(millions) + ' Million ';
      if (thousands) result += convertGroup(thousands) + ' Thousand ';
      if (remainder) result += convertGroup(remainder);
    }

    result = result.trim();

    if (sen > 0) {
      result += ' and ' + convertGroup(sen) + ' Sen';
    }

    return result;
  }

  async sendPayslipEmail(): Promise<void> {
    const payslip = this.payslip();
    if (!payslip) return;

    this.sendingEmail.set(true);
    const toastId = toast.loading('Generating payslip PDF...');

    try {
      const pdfBlob = await this.generatePdfBlob();
      const fileName = `Payslip_${this.getMonthName(payslip.pay_period.month)}_${payslip.pay_period.year}.pdf`;

      toast.loading('Sending payslip email...', { id: toastId });

      this.payrollService.sendPayslipEmail(this.payrollPublicId()!, pdfBlob, fileName).subscribe({
        next: (response) => {
          this.sendingEmail.set(false);
          if (response.success) {
            toast.success(response.message || 'Payslip sent successfully', { id: toastId });
          } else {
            toast.error('Failed to send payslip email', { id: toastId });
          }
        },
        error: (err) => {
          this.sendingEmail.set(false);
          toast.error(err?.error?.message || 'Failed to send payslip email', { id: toastId });
        }
      });
    } catch (err) {
      this.sendingEmail.set(false);
      toast.error('Failed to generate payslip PDF', { id: toastId });
    }
  }
}

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap';

/** Raw payslip CSS for the print window (no Angular scoping) */
const PAYSLIP_PRINT_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 12.5px; color: #1a1a1a; background: #fff; }
.payslip { width: 100%; margin: 0; padding: 24px 28px; }
.header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
.header-left { display: flex; align-items: flex-start; gap: 16px; }
.company-logo { width: 60px; height: 60px; object-fit: contain; }
.company-logo-placeholder { width: 80px; height: 80px; border: 1px solid #d0d0d0; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; color: #555; text-align: center; border-radius: 4px; background: #f5f5f5; }
.company-info { padding-top: 4px; }
.company-info .title { font-size: 16px; font-weight: 600; letter-spacing: 0.3px; }
.company-info .company-name { font-size: 13px; margin-top: 2px; }
.company-info .reg-no { font-size: 12px; color: #555; margin-top: 1px; }
.header-right { text-align: right; padding-top: 4px; }
.header-right .period { font-size: 13px; }
.header-right .period strong { font-weight: 600; }
.header-right .issued { font-size: 12px; color: #555; margin-top: 2px; }
.divider-solid { height: 2px; margin: 16px 0; }
.divider-dashed { border: none; border-top: 1.5px dashed #bbb; margin: 20px 0; }
.employee-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 40px; margin: 20px 0; }
.info-row { display: flex; align-items: baseline; }
.info-label { width: 130px; flex-shrink: 0; font-size: 13px; color: #333; }
.info-colon { width: 14px; flex-shrink: 0; text-align: center; }
.info-value { font-size: 13px; font-weight: 400; }
.main-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
.main-table th { text-align: left; font-size: 13px; font-weight: 600; padding: 0px 12px 12px 12px; border: 1px solid #d0d0d0; background: #fafafa; white-space: nowrap; }
.main-table td { padding: 5px 10px; border-left: 1px solid #d0d0d0; border-right: 1px solid #d0d0d0; font-size: 13px; vertical-align: top; }
.main-table .amount { text-align: right; white-space: nowrap; }
.main-table .spacer-row td { height: 14px; }
.totals-row td { border-top: 1px solid #d0d0d0; border-bottom: 1px solid #d0d0d0; font-weight: 500; padding: 0px 12px 12px 12px; background: #fafafa; white-space: nowrap; letter-spacing: -0.05em; }
.tracking-tighter { letter-spacing: -0.05em; }
.net-payable { display: flex; align-items: center; margin-top: 16px; border: 1.5px solid #1a1a1a; }
.net-payable-label { flex: 1; padding: 0px 12px 14px 12px; border-right: 1.5px solid #1a1a1a; }
.net-payable-label .main-label { font-size: 14px; font-weight: 600; }
.net-payable-label .sub-label { font-size: 11px; color: #666; margin-top: 1px; }
.net-payable-amount { flex: 1; text-align: center; font-size: 18px; font-weight: 600; padding: 0px 12px 14px 12px; }
.amount-words { text-align: center; font-size: 12px; color: #444; margin: 18px 0 10px; font-style: italic; }
.ytd-section { margin-top: 14px; }
.ytd-table { width: 100%; border-collapse: collapse; }
.ytd-table td { padding: 4px 6px; font-size: 12px; vertical-align: top; }
.ytd-table .ytd-label { width: 200px; }
.ytd-table .ytd-rm { width: 30px; text-align: right; color: #555; }
.ytd-table .ytd-amount { width: 90px; text-align: right; }
.ytd-table .ytd-spacer { width: 30px; }
.confidential { text-align: center; font-size: 11.5px; color: #c0392b; font-style: italic; margin-top: 30px; }
@page { size: A4; margin: 15mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;
