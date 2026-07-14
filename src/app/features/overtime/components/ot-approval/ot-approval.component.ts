import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OvertimeService } from '../../services/overtime.service';
import { Overtime, DAY_TYPE_LABELS } from '../../models/overtime.model';

@Component({
  selector: 'app-ot-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ot-approval.component.html'
})
export class OtApprovalComponent implements OnInit {
  private overtimeService = inject(OvertimeService);

  readonly dayTypeLabels = DAY_TYPE_LABELS;

  loading = signal(false);
  rows = signal<Overtime[]>([]);
  processingId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.overtimeService.getTeamOvertime('Pending').subscribe({
      next: (res) => {
        this.rows.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
      }
    });
  }

  approve(row: Overtime): void {
    if (!row.public_id) return;
    this.processingId.set(row.public_id);
    this.overtimeService.approval(row.public_id, { action: 'approve' }).subscribe({
      next: () => {
        this.rows.set(this.rows().filter(r => r.public_id !== row.public_id));
        this.processingId.set(null);
      },
      error: () => this.processingId.set(null)
    });
  }

  reject(row: Overtime): void {
    if (!row.public_id) return;
    const reason = prompt('Reason for rejecting this overtime request:');
    if (!reason) return;
    this.processingId.set(row.public_id);
    this.overtimeService.approval(row.public_id, { action: 'reject', rejection_reason: reason }).subscribe({
      next: () => {
        this.rows.set(this.rows().filter(r => r.public_id !== row.public_id));
        this.processingId.set(null);
      },
      error: () => this.processingId.set(null)
    });
  }
}
