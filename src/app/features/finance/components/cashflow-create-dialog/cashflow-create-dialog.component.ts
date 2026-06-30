import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';
import { CashFlowService } from '../../services/cashflow.service';
import { CashFlowStatement } from '../../models/cashflow.model';

interface DialogData {
  onSuccess: (s: CashFlowStatement) => void;
}

@Component({
  selector: 'app-cashflow-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardFormLabelComponent,
    ZardDividerComponent
  ],
  template: `
    <div class="flex flex-col h-full">
      <div class="px-6 py-4 border-b border-border">
        <h2 class="text-lg font-semibold tracking-tight">New Cash Flow Forecast</h2>
        <p class="text-[13px] text-muted-foreground mt-1">Set up a monthly solvency / cash-flow projection.</p>
      </div>

      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <div>
          <label z-form-label>Title</label>
          <input z-input [(ngModel)]="title" placeholder="e.g. Solvency Test FY2025" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label z-form-label>Start month</label>
            <input z-input type="month" [(ngModel)]="startMonth" class="w-full" />
          </div>
          <div>
            <label z-form-label>Number of months</label>
            <input z-input type="number" min="1" max="36" [(ngModel)]="numMonths" class="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label z-form-label>Opening cash balance</label>
            <input z-input type="number" step="0.01" [(ngModel)]="openingBalance" class="w-full" />
          </div>
          <div>
            <label z-form-label>Currency</label>
            <input z-input [(ngModel)]="currency" maxlength="3" class="w-full" />
          </div>
        </div>

        <z-divider zSpacing="sm" />

        <label class="flex items-start gap-3 cursor-pointer select-none">
          <input type="checkbox" [(ngModel)]="seedTemplate" class="mt-0.5 h-4 w-4 accent-primary" />
          <span>
            <span class="text-sm font-medium text-foreground">Start from default template</span>
            <span class="block text-[12px] text-muted-foreground">
              Pre-fills standard inflow/outflow lines (project income, staff salary, rental, OPE, tax…). You can edit them after.
            </span>
          </span>
        </label>

        @if (error()) {
          <p class="text-[13px] text-destructive">{{ error() }}</p>
        }
      </div>

      <div class="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
        <button z-button zType="ghost" (click)="close()">Cancel</button>
        <button z-button (click)="submit()" [disabled]="saving()" class="gap-2">
          @if (saving()) { <z-icon zType="loader-circle" class="w-4 h-4 animate-spin" /> }
          Create
        </button>
      </div>
    </div>
  `
})
export class CashFlowCreateDialogComponent {
  private service = inject(CashFlowService);
  private dialogRef = inject(ZardDialogRef);
  private data = inject<DialogData>(Z_MODAL_DATA);

  title = 'Cash Flow Forecast';
  startMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  numMonths = 12;
  openingBalance = 0;
  currency = 'MYR';
  seedTemplate = true;

  saving = signal(false);
  error = signal('');

  submit() {
    if (!this.startMonth) { this.error.set('Start month is required'); return; }
    this.saving.set(true);
    this.error.set('');
    this.service.create({
      title: this.title?.trim() || 'Cash Flow Forecast',
      start_month: `${this.startMonth}-01`,
      num_months: Number(this.numMonths) || 12,
      opening_balance: Number(this.openingBalance) || 0,
      currency: (this.currency || 'MYR').toUpperCase().slice(0, 3),
      seed_template: this.seedTemplate
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.data.onSuccess(res.data);
          this.dialogRef.close();
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Failed to create cash flow forecast');
      }
    });
  }

  close() { this.dialogRef.close(); }
}
