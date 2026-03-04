import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PolicyService } from '../../services/policy.service';
import { Policy, PolicyStatistics } from '../../models/policy.model';

// ZardUI Component Imports
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardTableComponent } from '@/shared/components/table/table.component';

@Component({
  selector: 'app-policy-viewer',
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
  private currentPolicyId: string | null = null;

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

    this.policyService.getPolicyById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.policy.set(response.data);

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
    const policyId = this.policy()?.id;
    if (!policyId) return;

    this.acknowledging.set(true);

    this.policyService.acknowledgePolicy(policyId).subscribe({
      next: (response) => {
        if (response.success) {
          this.hasAcknowledged.set(true);
          if (this.currentPolicyId) this.loadPolicy(this.currentPolicyId);
        }
        this.acknowledging.set(false);
      },
      error: (err) => {
        alert('Failed to acknowledge policy. Please try again.');
        this.acknowledging.set(false);
        console.error('Error acknowledging policy:', err);
      }
    });
  }

  approvePolicy(): void {
    const policyId = this.policy()?.id;
    if (!policyId) return;

    const confirmed = confirm('Are you sure you want to approve this policy? This will make it active.');
    if (!confirmed) return;

    this.policyService.approvePolicy(policyId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Policy approved successfully');
          if (this.currentPolicyId) this.loadPolicy(this.currentPolicyId);
        }
      },
      error: (err) => {
        alert('Failed to approve policy. Please try again.');
        console.error('Error approving policy:', err);
      }
    });
  }

  activatePolicy(): void {
    const policyId = this.policy()?.id;
    if (!policyId) return;

    this.policyService.activatePolicy(policyId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Policy activated successfully');
          if (this.currentPolicyId) this.loadPolicy(this.currentPolicyId);
        }
      },
      error: (err) => {
        alert('Failed to activate policy. Please try again.');
        console.error('Error activating policy:', err);
      }
    });
  }

  archivePolicy(): void {
    const policyId = this.policy()?.id;
    if (!policyId) return;

    const confirmed = confirm('Are you sure you want to archive this policy?');
    if (!confirmed) return;

    this.policyService.archivePolicy(policyId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Policy archived successfully');
          if (this.currentPolicyId) this.loadPolicy(this.currentPolicyId);
        }
      },
      error: (err) => {
        alert('Failed to archive policy. Please try again.');
        console.error('Error archiving policy:', err);
      }
    });
  }

  deletePolicy(): void {
    const policyId = this.policy()?.id;
    if (!policyId) return;

    const confirmed = confirm('Are you sure you want to delete this policy? This action cannot be undone.');
    if (!confirmed) return;

    this.policyService.deletePolicy(policyId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Policy deleted successfully');
          this.router.navigate(['/communication/policies']);
        }
      },
      error: (err) => {
        alert('Failed to delete policy. Please try again.');
        console.error('Error deleting policy:', err);
      }
    });
  }

  getCategoryBadgeType(category: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'HR': 'default',
      'IT': 'secondary',
      'Finance': 'default',
      'Safety': 'outline',
      'Compliance': 'destructive',
      'Operations': 'secondary',
      'Other': 'outline'
    };
    return variantMap[category] || 'secondary';
  }

  getStatusBadgeType(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Active': 'default',
      'Draft': 'secondary',
      'Archived': 'outline',
      'Superseded': 'destructive'
    };
    return variantMap[status] || 'secondary';
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

    // In a real implementation, this would download the file
    window.open(policy.file_url, '_blank');
  }
}
