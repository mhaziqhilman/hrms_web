import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PersonalService } from '../../services/personal.service';
import { EmployeeProfile, UpdateProfileRequest } from '../../models/personal.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardTabComponent, ZardTabGroupComponent } from '@/shared/components/tabs/tabs.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardProgressBarComponent } from '@/shared/components/progress-bar/progress-bar.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardTabComponent,
    ZardTabGroupComponent,
    ZardBadgeComponent,
    ZardProgressBarComponent,
    ZardAvatarComponent,
    ZardDividerComponent
  ],
  templateUrl: './my-profile.component.html'
})
export class MyProfileComponent implements OnInit {
  private personalService = inject(PersonalService);
  private alertDialogService = inject(ZardAlertDialogService);

  // State
  loading = signal(false);
  saving = signal(false);
  editMode = signal(false);
  profile = signal<EmployeeProfile | null>(null);

  // Editable form data
  formData: UpdateProfileRequest = {};

  // Computed: profile initials
  initials = computed(() => {
    const name = this.profile()?.full_name;
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  });

  // Computed: years of service
  yearsOfService = computed(() => {
    const joinDate = this.profile()?.join_date;
    if (!joinDate) return '0';
    const join = new Date(joinDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - join.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (years < 1) {
      const months = Math.floor((now.getTime() - join.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
      return `${months}m`;
    }
    return `${years}`;
  });

  // Computed: profile completion percentage
  profileCompletion = computed(() => {
    const p = this.profile();
    if (!p) return 0;

    const fields = [
      p.full_name,
      p.ic_no,
      p.date_of_birth,
      p.gender,
      p.marital_status,
      p.nationality,
      p.mobile,
      p.email,
      p.current_address,
      p.permanent_address,
      p.emergency_contact_name,
      p.emergency_contact_phone,
      p.position,
      p.department,
      p.bank_name,
      p.bank_account_no,
      p.epf_no,
      p.socso_no,
      p.tax_no,
      p.photo_url
    ];

    const filled = fields.filter(f => f !== null && f !== undefined && f !== '').length;
    return Math.round((filled / fields.length) * 100);
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);

    this.personalService.getMyProfile().subscribe({
      next: (response) => {
        if (response.success) {
          this.profile.set(response.data);
          this.resetFormData();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: 'Failed to load profile',
          zOkText: 'OK'
        });
      }
    });
  }

  toggleEditMode(): void {
    if (this.editMode()) {
      this.resetFormData();
    }
    this.editMode.set(!this.editMode());
  }

  resetFormData(): void {
    const p = this.profile();
    if (p) {
      this.formData = {
        mobile: p.mobile || '',
        email: p.email || '',
        current_address: p.current_address || '',
        permanent_address: p.permanent_address || '',
        emergency_contact_name: p.emergency_contact_name || '',
        emergency_contact_phone: p.emergency_contact_phone || ''
      };
    }
  }

  saveProfile(): void {
    this.saving.set(true);

    this.personalService.updateMyProfile(this.formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.profile.set(response.data);
          this.editMode.set(false);
          this.alertDialogService.info({
            zTitle: 'Success',
            zDescription: 'Profile updated successfully',
            zOkText: 'OK'
          });
        }
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: 'Failed to update profile',
          zOkText: 'OK'
        });
      }
    });
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
  }
}
