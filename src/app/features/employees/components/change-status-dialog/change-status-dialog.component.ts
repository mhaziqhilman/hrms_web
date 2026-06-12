import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Z_MODAL_DATA } from '@/shared/components/dialog/dialog.service';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardDatePickerComponent } from '@/shared/components/date-picker/date-picker.component';
import { Employee, EmploymentStatus } from '../../models/employee.model';

export interface ChangeStatusDialogData {
  employee: Employee;
}

export interface ChangeStatusResult {
  employment_status: EmploymentStatus;
  end_date: string | null;
  reason: string;
}

@Component({
  selector: 'app-change-status-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardSelectComponent, ZardSelectItemComponent, ZardDatePickerComponent],
  template: `
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">
        Update <span class="font-medium text-foreground">{{ data?.employee?.full_name }}</span>'s
        employment status. When marking an employee as resigned or terminated, you can record
        their last working day.
      </p>

      <!-- Status -->
      <div class="space-y-2">
        <label class="block text-sm font-normal text-foreground">
          Employment Status <span class="text-destructive">*</span>
        </label>
        <z-select [(ngModel)]="status" zPlaceholder="Select status">
          <z-select-item zValue="Active">Active</z-select-item>
          <z-select-item zValue="Resigned">Resigned</z-select-item>
          <z-select-item zValue="Terminated">Terminated</z-select-item>
        </z-select>
      </div>

      @if (status !== 'Active') {
        <!-- End date (last working day) -->
        <div class="space-y-2">
          <label class="block text-sm font-normal text-foreground">Last Working Day</label>
          <z-date-picker [(ngModel)]="endDate" placeholder="Pick last working day" zFormat="dd-MM-yyyy" />
          <p class="text-xs pt-2 text-muted-foreground">Optional — leave blank if not yet decided.</p>
        </div>

        <!-- Reason -->
        <div class="space-y-2">
          <label class="block text-sm font-normal text-foreground">Reason</label>
          <textarea
            rows="2"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            [(ngModel)]="reason"
            placeholder="Optional note (e.g. resignation, contract ended)"
          ></textarea>
        </div>
      } @else {
        <p class="text-xs text-muted-foreground">
          Reactivating this employee will clear any recorded last working day.
        </p>
      }
    </div>
  `
})
export class ChangeStatusDialogComponent {
  data = inject(Z_MODAL_DATA, { optional: true }) as ChangeStatusDialogData | null;

  status: EmploymentStatus = (this.data?.employee?.employment_status as EmploymentStatus) || 'Active';
  endDate: Date | null = this.data?.employee?.end_date ? new Date(this.data.employee.end_date) : null;
  reason = '';

  isValid(): boolean {
    return ['Active', 'Resigned', 'Terminated'].includes(this.status);
  }

  getData(): ChangeStatusResult {
    return {
      employment_status: this.status,
      end_date: this.status === 'Active' ? null : this.formatDate(this.endDate),
      reason: this.reason
    };
  }

  /** Convert the picker's Date to a yyyy-MM-dd string the API expects. */
  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
