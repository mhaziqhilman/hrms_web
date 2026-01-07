import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MemoService } from '../../services/memo.service';
import { Memo, MemoStatistics } from '../../models/memo.model';

// ZardUI Component Imports
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardTableComponent } from '@/shared/components/table/table.component';

@Component({
  selector: 'app-memo-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardCardComponent,
    ZardBadgeComponent,
    ZardTableComponent
  ],
  templateUrl: './memo-viewer.html',
  styleUrl: './memo-viewer.css',
})
export class MemoViewerComponent implements OnInit {
  memo = signal<Memo | null>(null);
  statistics = signal<MemoStatistics | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  acknowledging = signal(false);
  loadingStatistics = signal(false);

  // User info would come from auth service
  // For now, we'll determine based on memo data
  canEdit = signal(false);
  canDelete = signal(false);
  canViewStatistics = signal(false);
  hasAcknowledged = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private memoService: MemoService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadMemo(id);
    }
  }

  loadMemo(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.memoService.getMemoById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.memo.set(response.data);

          // Determine permissions
          // In a real app, you'd check against current user from auth service
          this.canEdit.set(true); // Placeholder - should check if user is admin or author
          this.canDelete.set(true); // Placeholder - should check if user is admin or author
          this.canViewStatistics.set(true); // Placeholder - should check if user is admin/manager/author

          // Load statistics if user has permission
          if (this.canViewStatistics()) {
            this.loadStatistics(id);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load memo. Please try again.');
        this.loading.set(false);
        console.error('Error loading memo:', err);
      }
    });
  }

  loadStatistics(id: number): void {
    this.loadingStatistics.set(true);

    this.memoService.getMemoStatistics(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.statistics.set(response.data);
        }
        this.loadingStatistics.set(false);
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
        this.loadingStatistics.set(false);
      }
    });
  }

  acknowledgeMemo(): void {
    const memoId = this.memo()?.id;
    if (!memoId) return;

    this.acknowledging.set(true);

    this.memoService.acknowledgeMemo(memoId).subscribe({
      next: (response) => {
        if (response.success) {
          this.hasAcknowledged.set(true);
          // Reload memo to get updated acknowledgment count
          this.loadMemo(memoId);
        }
        this.acknowledging.set(false);
      },
      error: (err) => {
        alert('Failed to acknowledge memo. Please try again.');
        this.acknowledging.set(false);
        console.error('Error acknowledging memo:', err);
      }
    });
  }

  deleteMemo(): void {
    const memoId = this.memo()?.id;
    if (!memoId) return;

    const confirmed = confirm('Are you sure you want to delete this memo? This action cannot be undone.');
    if (!confirmed) return;

    this.memoService.deleteMemo(memoId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Memo deleted successfully');
          this.router.navigate(['/communication/memos']);
        }
      },
      error: (err) => {
        alert('Failed to delete memo. Please try again.');
        console.error('Error deleting memo:', err);
      }
    });
  }

  publishMemo(): void {
    const memoId = this.memo()?.id;
    if (!memoId) return;

    this.memoService.publishMemo(memoId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Memo published successfully');
          this.loadMemo(memoId);
        }
      },
      error: (err) => {
        alert('Failed to publish memo. Please try again.');
        console.error('Error publishing memo:', err);
      }
    });
  }

  archiveMemo(): void {
    const memoId = this.memo()?.id;
    if (!memoId) return;

    const confirmed = confirm('Are you sure you want to archive this memo?');
    if (!confirmed) return;

    this.memoService.archiveMemo(memoId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Memo archived successfully');
          this.loadMemo(memoId);
        }
      },
      error: (err) => {
        alert('Failed to archive memo. Please try again.');
        console.error('Error archiving memo:', err);
      }
    });
  }

  getPriorityBadgeType(priority: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Urgent': 'destructive',
      'High': 'default',
      'Normal': 'secondary',
      'Low': 'outline'
    };
    return variantMap[priority] || 'secondary';
  }

  getStatusBadgeType(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Published': 'default',
      'Draft': 'secondary',
      'Archived': 'outline'
    };
    return variantMap[status] || 'secondary';
  }

  isExpired(): boolean {
    const memo = this.memo();
    if (!memo || !memo.expires_at) return false;
    return new Date(memo.expires_at) < new Date();
  }

  goBack(): void {
    this.router.navigate(['/communication/memos']);
  }
}
