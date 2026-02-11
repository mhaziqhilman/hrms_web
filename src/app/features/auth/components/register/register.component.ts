import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardInputDirective,
    ZardFormLabelComponent,
    ZardDividerComponent,
    ZardIconComponent
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  loading = false;
  errorMessage = '';
  passwordFieldType: 'password' | 'text' = 'password';
  confirmPasswordFieldType: 'password' | 'text' = 'password';
  passwordStrength: number = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.setupPasswordStrengthCheck();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  initForm(): void {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9]).*$/) // At least one uppercase and one number
      ]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  setupPasswordStrengthCheck(): void {
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.passwordStrength = this.calculatePasswordStrength(password || '');
    });
  }

  calculatePasswordStrength(password: string): number {
    if (!password) return 0;

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;

    // Has lowercase
    if (/[a-z]/.test(password)) strength += 12.5;

    // Has uppercase
    if (/[A-Z]/.test(password)) strength += 12.5;

    // Has numbers
    if (/[0-9]/.test(password)) strength += 12.5;

    // Has special characters
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

    return Math.min(strength, 100);
  }

  getPasswordStrengthClass(): string {
    if (this.passwordStrength === 0) return '';
    if (this.passwordStrength < 40) return 'bg-danger';
    if (this.passwordStrength < 60) return 'bg-warning';
    if (this.passwordStrength < 80) return 'bg-info';
    return 'bg-success';
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength === 0) return '';
    if (this.passwordStrength < 40) return 'Weak';
    if (this.passwordStrength < 60) return 'Fair';
    if (this.passwordStrength < 80) return 'Good';
    return 'Strong';
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
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { fullName, email, password } = this.registerForm.value;

    this.authService.register({ email, password, fullName }).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Registration successful:', response);

        // Navigate to email verification pending page
        this.router.navigate(['/auth/verify-email-pending']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Registration failed. Please try again.';
        console.error('Registration error:', error);
      }
    });
  }
}
