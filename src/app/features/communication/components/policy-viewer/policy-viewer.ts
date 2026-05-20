import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';
import { PolicyService } from '../../services/policy.service';
import { Policy, PolicyStatistics, PolicyAcknowledgment } from '../../models/policy.model';
import { AuthService } from '@/core/services/auth.service';

// ZardUI Component Imports
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { AppDatePipe, AppDateTimePipe } from '@/shared/pipes/app-date.pipe';

@Component({
  selector: 'app-policy-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ZardButtonComponent,
    ZardIconComponent,
    ...ZardMenuImports,
    ZardDividerComponent,
    AppDatePipe,
    AppDateTimePipe
  ],
  templateUrl: './policy-viewer.html',
  styleUrl: './policy-viewer.css',
})
export class PolicyViewerComponent implements OnInit {
  policy = signal<Policy | null>(null);
  statistics = signal<PolicyStatistics | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  acknowledging = signal(false);
  loadingStatistics = signal(false);

  // User permissions - would come from auth service
  canEdit = signal(false);
  canDelete = signal(false);
  canApprove = signal(false);
  canViewStatistics = signal(false);
  hasAcknowledged = signal(false);

  // UI state — collapse/expand the acknowledgment table
  showAllAcks = signal(false);

  private currentPolicyId: string | null = null;

  /** Total audience size (employees expected to ack). */
  totalAudience = computed(() => this.statistics()?.total_employees ?? 0);

  /** Count of completed acknowledgments. */
  ackCount = computed(() => this.statistics()?.total_acknowledgments ?? 0);

  /** Count of distinct viewers (mirrors policy.view_count when stats absent). */
  viewCount = computed(
    () => this.statistics()?.total_views ?? this.policy()?.view_count ?? 0
  );

  /** Pending = audience size − acknowledged (never negative). */
  pendingCount = computed(() => Math.max(0, this.totalAudience() - this.ackCount()));

  /** Acknowledgment % — fraction of audience that has acked, clamped. */
  ackPercent = computed(() => this.pct(this.ackCount(), this.totalAudience()));

  /** Views % — fraction of audience that has viewed, clamped. */
  viewsPercent = computed(() => this.pct(this.viewCount(), this.totalAudience()));

  /** Pending % — complement of ack%. */
  pendingPercent = computed(() => this.pct(this.pendingCount(), this.totalAudience()));

  /** Acknowledgments slice — top 2 (compact) or all (after “View all”). */
  displayedAcks = computed<PolicyAcknowledgment[]>(() => {
    const acks = this.statistics()?.acknowledgments ?? [];
    return this.showAllAcks() ? acks : acks.slice(0, 2);
  });

  private pct(part: number, whole: number): number {
    if (!whole || whole <= 0) return 0;
    return Math.min(100, Math.max(0, (part / whole) * 100));
  }

  private authService = inject(AuthService);
  private alertDialogService = inject(ZardAlertDialogService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private policyService: PolicyService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.currentPolicyId = id;
      this.loadPolicy(id);
    }
  }

  loadPolicy(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Reset stale per-policy state so navigating between policies doesn't
    // carry over the previous one's ack status.
    this.hasAcknowledged.set(false);

    this.policyService.getPolicyById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.policy.set(response.data);

          // Reflect existing acknowledgment from the loaded record so the
          // banner/CTA stays in sync after page refresh or re-navigation.
          this.hasAcknowledged.set(this.computeHasAcknowledged(response.data));

          // Determine permissions (placeholder - should check actual user roles)
          this.canEdit.set(true);
          this.canDelete.set(true);
          this.canApprove.set(true);
          this.canViewStatistics.set(true);

          // Load statistics if user has permission
          if (this.canViewStatistics()) {
            this.loadStatistics(id);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load policy. Please try again.');
        this.loading.set(false);
        console.error('Error loading policy:', err);
      }
    });
  }

  /**
   * True when the currently signed-in user has an acknowledgment row for
   * THIS version of the policy with `acknowledged_at` set. Returns false
   * if the user has no employee record (e.g. super_admin) or the policy
   * has no acks yet.
   */
  private computeHasAcknowledged(policy: Policy): boolean {
    const employeeId = this.authService.getCurrentUserValue()?.employee?.id;
    if (!employeeId) return false;
    const acks = policy.acknowledgments ?? [];
    return acks.some(a =>
      a.employee_id === employeeId &&
      a.policy_version === policy.version &&
      !!a.acknowledged_at
    );
  }

  loadStatistics(id: string | number): void {
    this.loadingStatistics.set(true);

    this.policyService.getPolicyStatistics(id).subscribe({
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

  acknowledgePolicy(): void {
    const policyId = this.policy()?.public_id;
    if (!policyId) return;

    this.acknowledging.set(true);

    this.policyService.acknowledgePolicy(policyId).subscribe({
      next: (response) => {
        if (response.success) {
          this.hasAcknowledged.set(true);
          toast.success(response.message || 'Policy acknowledged');
          if (this.currentPolicyId) this.loadPolicy(this.currentPolicyId);
        }
        this.acknowledging.set(false);
      },
      error: (err) => {
        const msg: string = err?.error?.message ?? '';

        // Backend returns 400 + this message when the user has already acked.
        // That isn't a failure — just sync the UI and tell them politely.
        if (err?.status === 400 && /already acknowledged/i.test(msg)) {
          this.hasAcknowledged.set(true);
          toast.info(msg || 'You have already acknowledged this policy');
          if (this.currentPolicyId) this.loadPolicy(this.currentPolicyId);
        } else {
          toast.error(msg || 'Failed to acknowledge policy. Please try again.');
          console.error('Error acknowledging policy:', err);
        }
        this.acknowledging.set(false);
      }
    });
  }

  approvePolicy(): void {
    const policyId = this.policy()?.public_id;
    if (!policyId) return;

    this.alertDialogService.confirm({
      zTitle: 'Approve Policy',
      zDescription: 'Are you sure you want to approve this policy? This will make it active.',
      zOkText: 'Approve',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.policyService.approvePolicy(policyId).subscribe({
          next: (response) => {
            if (response.success) {
              toast.success(response.message || 'Policy approved');
              if (this.currentPolicyId) this.loadPolicy(this.currentPolicyId);
            }
          },
          error: (err) => {
            toast.error(err?.error?.message || 'Failed to approve policy. Please try again.');
            console.error('Error approving policy:', err);
          }
        });
      }
    });
  }

  activatePolicy(): void {
    const policyId = this.policy()?.public_id;
    if (!policyId) return;

    this.policyService.activatePolicy(policyId).subscribe({
      next: (response) => {
        if (response.success) {
          toast.success(response.message || 'Policy activated');
          if (this.currentPolicyId) this.loadPolicy(this.currentPolicyId);
        }
      },
      error: (err) => {
        toast.error(err?.error?.message || 'Failed to activate policy. Please try again.');
        console.error('Error activating policy:', err);
      }
    });
  }

  archivePolicy(): void {
    const policyId = this.policy()?.public_id;
    if (!policyId) return;

    this.alertDialogService.confirm({
      zTitle: 'Archive Policy',
      zDescription: 'Are you sure you want to archive this policy?',
      zOkText: 'Archive',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.policyService.archivePolicy(policyId).subscribe({
          next: (response) => {
            if (response.success) {
              toast.success(response.message || 'Policy archived');
              if (this.currentPolicyId) this.loadPolicy(this.currentPolicyId);
            }
          },
          error: (err) => {
            toast.error(err?.error?.message || 'Failed to archive policy. Please try again.');
            console.error('Error archiving policy:', err);
          }
        });
      }
    });
  }

  deletePolicy(): void {
    const policyId = this.policy()?.public_id;
    if (!policyId) return;

    this.alertDialogService.confirm({
      zTitle: 'Delete Policy',
      zDescription: 'Are you sure you want to delete this policy? This action cannot be undone.',
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.policyService.deletePolicy(policyId).subscribe({
          next: (response) => {
            if (response.success) {
              toast.success(response.message || 'Policy deleted');
              this.router.navigate(['/communication/policies']);
            }
          },
          error: (err) => {
            toast.error(err?.error?.message || 'Failed to delete policy. Please try again.');
            console.error('Error deleting policy:', err);
          }
        });
      }
    });
  }

  isExpired(): boolean {
    const policy = this.policy();
    if (!policy || !policy.expires_at) return false;
    return new Date(policy.expires_at) < new Date();
  }

  goBack(): void {
    this.router.navigate(['/communication/policies']);
  }

  downloadPolicy(): void {
    const policy = this.policy();
    if (!policy || !policy.file_url) return;
    window.open(policy.file_url, '_blank');
  }

  toggleShowAllAcks(): void {
    this.showAllAcks.update(v => !v);
  }

  /** Extract up to 2 initials from a name (falls back to first 2 letters of email local-part). */
  getInitials(input: string | null | undefined): string {
    if (!input) return '··';
    const source = input.includes('@') ? input.split('@')[0] : input;
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return source.slice(0, 2).toUpperCase();
    const first = parts[0][0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] ?? '');
    return (first + last).toUpperCase();
  }

  /** Pick a stable gradient for a person based on their name. Mirrors mockup palette. */
  getAvatarGradient(input: string | null | undefined): string {
    const palette = [
      'from-violet-500 to-violet-700',
      'from-amber-500 to-amber-600',
      'from-rose-500 to-rose-600',
      'from-emerald-500 to-emerald-700',
      'from-sky-500 to-sky-700',
      'from-fuchsia-500 to-fuchsia-700',
      'from-indigo-500 to-indigo-700',
      'from-teal-500 to-teal-700',
    ];
    if (!input) return palette[0];
    let hash = 0;
    for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) | 0;
    return palette[Math.abs(hash) % palette.length];
  }
}
