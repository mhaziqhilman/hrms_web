import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { PayrollService } from './payroll.service';
import { Payslip, MONTH_NAMES } from '../models/payroll.model';
import { DisplayService } from '@/core/services/display.service';

@Injectable({ providedIn: 'root' })
export class PayslipPdfService {
  private payrollService = inject(PayrollService);
  private displayService = inject(DisplayService);

  async generateForPayrollId(payrollPublicId: string): Promise<{ blob: Blob; fileName: string; payslip: Payslip }> {
    const response = await firstValueFrom(this.payrollService.getPayslip(payrollPublicId));
    if (!response?.success || !response.data) {
      throw new Error('Failed to load payslip');
    }
    const payslip = response.data;
    const blob = await this.generateForPayslip(payslip);
    const fileName = `Payslip - ${MONTH_NAMES[payslip.pay_period.month - 1]} ${payslip.pay_period.year} (${payslip.employee.full_name}).pdf`;
    return { blob, fileName, payslip };
  }

  async generateForPayslip(payslip: Payslip): Promise<Blob> {
    const html = this.buildPayslipHtml(payslip);
    return this.renderPdf(html);
  }

  private async renderPdf(payslipHtml: string): Promise<Blob> {
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
</head><body>${payslipHtml}</body></html>`);
    iframeDoc.close();

    await new Promise<void>((resolve) => { iframe.onload = () => resolve(); });
    await iframeDoc.fonts.ready;

    const target = iframeDoc.querySelector('.payslip') as HTMLElement;
    const canvas = await html2canvas(target, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 800,
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

  private buildPayslipHtml(p: Payslip): string {
    const fmt = (n: number | string | null | undefined) => {
      const num = typeof n === 'string' ? parseFloat(n) : n;
      if (num === null || num === undefined || isNaN(num)) return '0.00';
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const totalContributions =
      (p.employer_contributions.epf_employer || 0) +
      (p.employer_contributions.socso_employer || 0) +
      (p.employer_contributions.eis_employer || 0);

    const primary = p.company?.primary_color || '#6b21a8';
    const secondary = p.company?.secondary_color || '#0891b2';
    const dividerGradient = `linear-gradient(to right, ${primary}, ${secondary})`;

    const logo = p.company.logo_url
      ? `<img class="company-logo" src="${escapeHtml(p.company.logo_url)}" alt="Company Logo">`
      : `<div class="company-logo-placeholder">${escapeHtml(initials(p.company.name))}</div>`;

    const regNo = p.company.registration_no
      ? `<div class="reg-no">Registration No. ${escapeHtml(p.company.registration_no)}</div>`
      : '';

    const issued = p.issued_by
      ? `<div class="issued">Issued on ${escapeHtml(this.displayService.formatDate(p.generated_at))} by ${escapeHtml(p.issued_by)}</div>`
      : `<div class="issued">Issued on ${escapeHtml(this.displayService.formatDate(p.generated_at))}</div>`;

    const ytdSection = p.ytd
      ? `
      <div class="ytd-section">
        <table class="ytd-table">
          <tr>
            <td class="ytd-label">YTD Employee EPF</td>
            <td class="ytd-rm">:RM</td>
            <td class="ytd-amount">${fmt(p.ytd.epf_employee)}</td>
            <td class="ytd-spacer"></td>
            <td class="ytd-label">YTD Employer EPF</td>
            <td class="ytd-rm">:RM</td>
            <td class="ytd-amount">${fmt(p.ytd.epf_employer)}</td>
          </tr>
          <tr>
            <td class="ytd-label">YTD Employee SOCSO</td>
            <td class="ytd-rm">:RM</td>
            <td class="ytd-amount">${fmt(p.ytd.socso_employee)}</td>
            <td class="ytd-spacer"></td>
            <td class="ytd-label">YTD Employer SOCSO</td>
            <td class="ytd-rm">:RM</td>
            <td class="ytd-amount">${fmt(p.ytd.socso_employer)}</td>
          </tr>
          <tr>
            <td class="ytd-label">YTD Employee EIS</td>
            <td class="ytd-rm">:RM</td>
            <td class="ytd-amount">${fmt(p.ytd.eis_employee)}</td>
            <td class="ytd-spacer"></td>
            <td class="ytd-label">YTD Employer EIS</td>
            <td class="ytd-rm">:RM</td>
            <td class="ytd-amount">${fmt(p.ytd.eis_employer)}</td>
          </tr>
          <tr>
            <td class="ytd-label">YTD Employee Income Tax PCB</td>
            <td class="ytd-rm">:RM</td>
            <td class="ytd-amount">${fmt(p.ytd.pcb)}</td>
            <td class="ytd-spacer"></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </table>
      </div>`
      : '';

    return `
<div class="payslip">
  <div class="header">
    <div class="header-left">
      ${logo}
      <div class="company-info">
        <div class="title">PAYSLIP</div>
        <div class="company-name">${escapeHtml(p.company.name)}</div>
        ${regNo}
      </div>
    </div>
    <div class="header-right">
      <div class="period">Payslip for <strong>${MONTH_NAMES[p.pay_period.month - 1]} ${p.pay_period.year}</strong></div>
      ${issued}
    </div>
  </div>

  <div class="divider-solid" style="background: ${dividerGradient};"></div>

  <div class="employee-info">
    <div class="info-row"><span class="info-label">Employee Name</span><span class="info-colon">:</span><span class="info-value">${escapeHtml(p.employee.full_name)}</span></div>
    <div class="info-row"><span class="info-label">Employee ID</span><span class="info-colon">:</span><span class="info-value">${escapeHtml(p.employee.employee_id)}</span></div>
    <div class="info-row"><span class="info-label">I/C No</span><span class="info-colon">:</span><span class="info-value">${escapeHtml(p.employee.ic_no || 'N/A')}</span></div>
    <div class="info-row"><span class="info-label">Designation</span><span class="info-colon">:</span><span class="info-value">${escapeHtml(p.employee.position || 'N/A')}</span></div>
    <div class="info-row"><span class="info-label">Bank Name</span><span class="info-colon">:</span><span class="info-value">${escapeHtml(p.bank_details.bank_name || 'N/A')}</span></div>
    <div class="info-row"><span class="info-label">Department</span><span class="info-colon">:</span><span class="info-value">${escapeHtml(p.employee.department || 'N/A')}</span></div>
    <div class="info-row"><span class="info-label">Account No</span><span class="info-colon">:</span><span class="info-value">${escapeHtml(p.bank_details.account_no || 'N/A')}</span></div>
    <div class="info-row"></div>
  </div>

  <hr class="divider-dashed">

  <table class="main-table">
    <thead>
      <tr class="tracking-tighter">
        <th>Earnings</th>
        <th class="amount"></th>
        <th>Deductions</th>
        <th class="amount"></th>
        <th>Employer Contributions</th>
        <th class="amount"></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Basic Salary</td>
        <td class="amount">${fmt(p.earnings.basic_salary)}</td>
        <td>EPF</td>
        <td class="amount">${fmt(p.deductions.epf_employee)}</td>
        <td>EPF</td>
        <td class="amount">${fmt(p.employer_contributions.epf_employer)}</td>
      </tr>
      <tr>
        <td>${p.earnings.allowances > 0 ? 'Allowances' : ''}</td>
        <td class="amount">${p.earnings.allowances > 0 ? fmt(p.earnings.allowances) : ''}</td>
        <td>SOCSO</td>
        <td class="amount">${fmt(p.deductions.socso_employee)}</td>
        <td>SOCSO</td>
        <td class="amount">${fmt(p.employer_contributions.socso_employer)}</td>
      </tr>
      <tr>
        <td>${p.earnings.overtime_pay > 0 ? 'Overtime Pay' : ''}</td>
        <td class="amount">${p.earnings.overtime_pay > 0 ? fmt(p.earnings.overtime_pay) : ''}</td>
        <td>EIS</td>
        <td class="amount">${fmt(p.deductions.eis_employee)}</td>
        <td>EIS</td>
        <td class="amount">${fmt(p.employer_contributions.eis_employer)}</td>
      </tr>
      <tr>
        <td>${p.earnings.bonus > 0 ? 'Bonus' : ''}</td>
        <td class="amount">${p.earnings.bonus > 0 ? fmt(p.earnings.bonus) : ''}</td>
        <td>${p.deductions.pcb_deduction > 0 ? 'PCB' : ''}</td>
        <td class="amount">${p.deductions.pcb_deduction > 0 ? fmt(p.deductions.pcb_deduction) : ''}</td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>${p.earnings.commission > 0 ? 'Commission' : ''}</td>
        <td class="amount">${p.earnings.commission > 0 ? fmt(p.earnings.commission) : ''}</td>
        <td>${p.deductions.unpaid_leave_deduction > 0 ? 'Unpaid Leave' : ''}</td>
        <td class="amount">${p.deductions.unpaid_leave_deduction > 0 ? fmt(p.deductions.unpaid_leave_deduction) : ''}</td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td>${p.deductions.other_deductions > 0 ? 'Other' : ''}</td>
        <td class="amount">${p.deductions.other_deductions > 0 ? fmt(p.deductions.other_deductions) : ''}</td>
        <td></td>
        <td></td>
      </tr>
      <tr class="spacer-row"><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr class="spacer-row"><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr class="spacer-row"><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr class="spacer-row"><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    </tbody>
    <tfoot>
      <tr class="totals-row tracking-tighter">
        <td>Gross Earnings (RM)</td>
        <td class="amount">${fmt(p.earnings.gross_salary)}</td>
        <td>Total Deductions (RM)</td>
        <td class="amount">${fmt(p.deductions.total_deductions)}</td>
        <td>Total Contributions (RM)</td>
        <td class="amount">${fmt(totalContributions)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="net-payable">
    <div class="net-payable-label">
      <div class="main-label">Total Net Payable (RM)</div>
      <div class="sub-label">Gross Earning - Total Deduction</div>
    </div>
    <div class="net-payable-amount">RM${fmt(p.net_salary)}</div>
  </div>

  <div class="amount-words">
    Amount in Words: ${escapeHtml(amountInWords(p.net_salary))}
  </div>

  ${ytdSection}

  <p class="confidential">
    This payslip is confidential and intended only for the recipient. Unauthorized disclosure is prohibited.
  </p>
</div>`;
  }
}

function escapeHtml(str: string): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initials(name: string): string {
  if (!name) return '';
  return name.split(' ').filter((w) => w.length > 0).map((w) => w[0]).join('').toUpperCase().slice(0, 3);
}

function amountInWords(amount: number): string {
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

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap';

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
