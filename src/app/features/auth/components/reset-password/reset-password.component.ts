import { Component, OnInit, ChangeDetectorRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardInputDirective,
    ZardFormLabelComponent,
    ZardIconComponent
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  resetPasswordForm!: FormGroup;
  loading = false;
  success = false;
  errorMessage = '';
  token: string | null = null;
  passwordFieldType: 'password' | 'text' = 'password';
  confirmPasswordFieldType: 'password' | 'text' = 'password';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.errorMessage = 'Invalid reset link. No token provided.';
    }

    this.initForm();
  }

  initForm(): void {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordFieldType = this.confirmPasswordFieldType === 'password' ? 'text' : 'password';
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        this.resetPasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Invalid reset link. Please request a new one.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const { password } = this.resetPasswordForm.value;

    this.authService.resetPassword({ token: this.token, newPassword: password }).subscribe({
      next: () => {
        this.zone.run(() => {
          this.loading = false;
          this.success = true;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.zone.run(() => {
          this.loading = false;
          this.errorMessage = error.message || 'Failed to reset password. The link may have expired.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
