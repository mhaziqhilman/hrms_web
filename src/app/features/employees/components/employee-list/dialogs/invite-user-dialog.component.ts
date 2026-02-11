import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';

@Component({
  selector: 'app-invite-user-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">
        Send an invitation email to a new team member. They will receive a link to join your company.
      </p>

      <!-- Email Field -->
      <div class="space-y-2">
        <label for="inviteEmail" class="block text-sm font-medium text-foreground">
          Email Address <span class="text-destructive">*</span>
        </label>
        <input
          id="inviteEmail"
          type="email"
          class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          [(ngModel)]="email"
          (blur)="emailTouched.set(true)"
          placeholder="colleague&#64;company.com"
          [class.border-destructive]="emailTouched() && !isEmailValid()"
        />
        @if (emailTouched() && !isEmailValid()) {
          <p class="text-xs text-destructive">Please enter a valid email address</p>
        }
      </div>

      <!-- Role Dropdown -->
      <div class="space-y-2">
        <label for="inviteRole" class="block text-sm font-medium text-foreground">
          Role
        </label>
        <select
          id="inviteRole"
          class="flex w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          [(ngModel)]="role"
        >
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>
  `
})
export class InviteUserDialogComponent {
  dialogRef = inject(ZardDialogRef);

  email = '';
  role = 'staff';
  emailTouched = signal(false);

  isEmailValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  isValid(): boolean {
    return this.isEmailValid();
  }

  getInviteData(): { email: string; role: string } {
    return { email: this.email, role: this.role };
  }

  markTouched(): void {
    this.emailTouched.set(true);
  }
}
