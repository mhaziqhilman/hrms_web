import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonalService } from '../../services/personal.service';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardInputDirective } from '@/shared/components/input/input.directive';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective
  ],
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent {
  private personalService = inject(PersonalService);
  private alertDialogService = inject(ZardAlertDialogService);

  // State
  saving = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  // Form data
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  // Validation
  passwordStrength = signal<PasswordStrength>({ score: 0, label: '', color: '' });

  // Password requirements
  requirements = [
    { label: 'At least 8 characters', check: (p: string) => p.length >= 8 },
    { label: 'At least one uppercase letter', check: (p: string) => /[A-Z]/.test(p) },
    { label: 'At least one lowercase letter', check: (p: string) => /[a-z]/.test(p) },
    { label: 'At least one number', check: (p: string) => /[0-9]/.test(p) },
    { label: 'At least one special character (@$!%*?&)', check: (p: string) => /[@$!%*?&]/.test(p) }
  ];

  toggleCurrentPassword(): void {
    this.showCurrentPassword.set(!this.showCurrentPassword());
  }

  toggleNewPassword(): void {
    this.showNewPassword.set(!this.showNewPassword());
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  onNewPasswordChange(): void {
    this.updatePasswordStrength();
  }

  private updatePasswordStrength(): void {
    const password = this.newPassword;
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    let label = '';
    let color = '';

    if (score === 0) {
      label = '';
      color = '';
    } else if (score <= 2) {
      label = 'Weak';
      color = 'bg-red-500';
    } else if (score <= 4) {
      label = 'Fair';
      color = 'bg-yellow-500';
    } else if (score <= 5) {
      label = 'Good';
      color = 'bg-blue-500';
    } else {
      label = 'Strong';
      color = 'bg-green-500';
    }

    this.passwordStrength.set({ score, label, color });
  }

  isRequirementMet(index: number): boolean {
    return this.requirements[index].check(this.newPassword);
  }

  isFormValid(): boolean {
    return (
      this.currentPassword.length > 0 &&
      this.requirements.every(req => req.check(this.newPassword)) &&
      this.newPassword === this.confirmPassword
    );
  }

  passwordsMatch(): boolean {
    return this.confirmPassword.length === 0 || this.newPassword === this.confirmPassword;
  }

  changePassword(): void {
    if (!this.isFormValid()) {
      this.alertDialogService.warning({
        zTitle: 'Validation Error',
        zDescription: 'Please fill in all fields correctly',
        zOkText: 'OK'
      });
      return;
    }

    this.saving.set(true);

    this.personalService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.alertDialogService.info({
            zTitle: 'Success',
            zDescription: 'Your password has been changed successfully',
            zOkText: 'OK'
          });
          this.resetForm();
        }
        this.saving.set(false);
      },
      error: (error) => {
        this.saving.set(false);
        const message = error.error?.message || 'Failed to change password';
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: message,
          zOkText: 'OK'
        });
      }
    });
  }

  private resetForm(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordStrength.set({ score: 0, label: '', color: '' });
  }
}
