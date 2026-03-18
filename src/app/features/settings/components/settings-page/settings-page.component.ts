import { Component, OnInit, signal, inject, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SettingsService } from '../../services/settings.service';
import { PersonalService } from '@/features/personal/services/personal.service';
import { ThemeService, ThemePreference, BorderRadiusPreset } from '@/core/services/theme';
import { DisplayService } from '@/core/services/display.service';
import { MyPayslip, YTDSummary } from '@/features/personal/models/personal.model';
import {
  UserSettings,
  AccountInfo,
  AppearanceSettings,
  DisplaySettings,
  NotificationSettings
} from '../../models/settings.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { ZardIcon } from '@/shared/components/icon/icons';
import { UserProfileService } from '@/core/services/user-profile.service';
import { ProfilePictureCropDialogComponent } from '../profile-picture-crop-dialog/profile-picture-crop-dialog.component';

type SectionType = 'account' | 'payslips' | 'appearance' | 'notifications' | 'display';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardCheckboxComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardDividerComponent
  ],
  templateUrl: './settings-page.component.html'
})
export class SettingsPageComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private personalService = inject(PersonalService);
  private themeService = inject(ThemeService);
  private displayService = inject(DisplayService);
  private alertDialogService = inject(ZardAlertDialogService);
  private dialogService = inject(ZardDialogService);
  private userProfileService = inject(UserProfileService);
  private viewContainerRef = inject(ViewContainerRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Navigation
  activeSection = signal<SectionType>('account');

  navItems: { id: SectionType; label: string; icon: ZardIcon }[] = [
    { id: 'account', label: 'Account', icon: 'circle-user' },
    // { id: 'payslips', label: 'My Payslips', icon: 'receipt-text' },
    { id: 'appearance', label: 'Appearance', icon: 'sun-moon' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'display', label: 'Display', icon: 'monitor' }
  ];

  // State
  loading = signal(false);
  saving = signal(false);
  settings = signal<UserSettings | null>(null);
  accountInfo = signal<AccountInfo | null>(null);

  // Payslips state
  loadingPayslips = signal(false);
  downloading = signal<number | null>(null);
  payslips = signal<MyPayslip[]>([]);
  ytdSummary = signal<YTDSummary | null>(null);
  selectedYear = signal<number>(new Date().getFullYear());
  years: number[] = [];
  currentPage = signal(1);
  totalPages = signal(1);
  totalRecords = signal(0);
  pageSize = 12;

  // Appearance form
  selectedTheme: 'light' | 'dark' | 'system' = 'light';
  sidebarCollapsed = false;
  compactMode = false;
  selectedBorderRadius: BorderRadiusPreset = 'default';

  // Display form
  selectedLanguage = 'en';
  selectedTimezone = 'Asia/Kuala_Lumpur';
  selectedDateFormat = 'DD/MM/YYYY';
  selectedTimeFormat: '12h' | '24h' = '12h';

  languages = [
    { value: 'en', label: 'English' },
    { value: 'ms', label: 'Bahasa Melayu' },
    { value: 'zh', label: 'Chinese' }
  ];

  timezones = [
    { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala Lumpur (GMT+8)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
    { value: 'Asia/Jakarta', label: 'Asia/Jakarta (GMT+7)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
    { value: 'UTC', label: 'UTC (GMT+0)' }
  ];

  dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
  ];

  timeFormats = [
    { value: '12h', label: '12-hour (1:30 PM)' },
    { value: '24h', label: '24-hour (13:30)' }
  ];

  // Notification form
  emailNotifications = true;
  pushNotifications = true;
  notifyLeaveApproval = true;
  notifyClaimApproval = true;
  notifyPayslipReady = true;
  notifyMemoReceived = true;
  notifyPolicyUpdate = true;

  // Profile picture
  uploadingPhoto = signal(false);
  removingPhoto = signal(false);

  // Change password form
  savingPassword = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordStrength = signal<PasswordStrength>({ score: 0, label: '', color: '' });

  passwordRequirements = [
    { label: 'At least 8 characters', check: (p: string) => p.length >= 8 },
    { label: 'At least one uppercase letter', check: (p: string) => /[A-Z]/.test(p) },
    { label: 'At least one lowercase letter', check: (p: string) => /[a-z]/.test(p) },
    { label: 'At least one number', check: (p: string) => /[0-9]/.test(p) },
    { label: 'At least one special character (@$!%*?&)', check: (p: string) => /[@$!%*?&]/.test(p) }
  ];

  private readonly validSections: SectionType[] = ['account', 'payslips', 'appearance', 'notifications', 'display'];

  ngOnInit(): void {
    this.loadSettings();
    this.loadAccountInfo();

    // Generate year options for payslips
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.years.push(currentYear - i);
    }

    // Sync active section from route param
    this.route.params.subscribe(params => {
      const section = params['section'] as SectionType;
      if (section && this.validSections.includes(section)) {
        this.activeSection.set(section);
        if (section === 'payslips' && this.payslips().length === 0) {
          this.loadPayslips();
        }
      }
    });
  }

  setSection(section: SectionType): void {
    this.router.navigate(['/settings', section]);
  }

  getNavItemClass(id: SectionType): string {
    const base = 'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-normal transition-colors cursor-pointer w-full text-left';
    if (this.activeSection() === id) {
      return `${base} bg-muted text-foreground`;
    }
    return `${base} text-muted-foreground hover:bg-muted/50 hover:text-foreground`;
  }

  // --- Data Loading ---

  loadSettings(): void {
    this.loading.set(true);
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        if (response.success) {
          const s = response.data;
          this.settings.set(s);
          // Populate appearance form from ThemeService (source of truth, reflects top-nav toggles too)
          this.selectedTheme = this.themeService.themePreference();
          this.sidebarCollapsed = this.themeService.sidebarCollapsed();
          this.compactMode = this.themeService.compactMode();
          this.selectedBorderRadius = this.themeService.borderRadius();
          // Populate display form and sync DisplayService
          this.selectedLanguage = s.language;
          this.selectedTimezone = s.timezone;
          this.selectedDateFormat = s.date_format;
          this.selectedTimeFormat = s.time_format;
          this.displayService.update({
            date_format: s.date_format,
            time_format: s.time_format,
            timezone: s.timezone,
            language: s.language
          });
          // Populate notification form
          this.emailNotifications = s.email_notifications;
          this.pushNotifications = s.push_notifications;
          this.notifyLeaveApproval = s.notify_leave_approval;
          this.notifyClaimApproval = s.notify_claim_approval;
          this.notifyPayslipReady = s.notify_payslip_ready;
          this.notifyMemoReceived = s.notify_memo_received;
          this.notifyPolicyUpdate = s.notify_policy_update;
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadAccountInfo(): void {
    this.settingsService.getAccountInfo().subscribe({
      next: (response) => {
        if (response.success) {
          const data = response.data;
          // Only accept absolute URLs for photo_url — reject raw storage paths
          if (data.photo_url && !data.photo_url.startsWith('http')) {
            data.photo_url = null;
          }
          this.accountInfo.set(data);
        }
      }
    });
  }

  // --- Appearance ---

  setTheme(theme: ThemePreference): void {
    this.selectedTheme = theme;
    this.themeService.setTheme(theme);
  }

  onCompactModeChange(): void {
    this.themeService.setCompactMode(this.compactMode);
  }

  setBorderRadius(preset: BorderRadiusPreset): void {
    this.selectedBorderRadius = preset;
    this.themeService.setBorderRadius(preset);
  }

  onSidebarCollapsedChange(): void {
    this.themeService.setSidebarCollapsed(this.sidebarCollapsed);
  }

  saveAppearance(): void {
    this.saving.set(true);
    const data: AppearanceSettings = {
      theme: this.selectedTheme,
      sidebar_collapsed: this.sidebarCollapsed,
      compact_mode: this.compactMode,
      border_radius: this.selectedBorderRadius
    };

    // Apply all settings immediately
    this.themeService.setTheme(this.selectedTheme);
    this.themeService.setCompactMode(this.compactMode);
    this.themeService.setBorderRadius(this.selectedBorderRadius);
    this.themeService.setSidebarCollapsed(this.sidebarCollapsed);

    this.settingsService.updateAppearance(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.alertDialogService.info({
            zTitle: 'Success',
            zDescription: 'Appearance settings updated successfully',
            zOkText: 'OK'
          });
        }
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: 'Failed to update appearance settings',
          zOkText: 'OK'
        });
      }
    });
  }

  // --- Display ---

  onLanguageChange(value: string): void {
    this.selectedLanguage = value;
  }

  onTimezoneChange(value: string): void {
    this.selectedTimezone = value;
  }

  onDateFormatChange(value: string): void {
    this.selectedDateFormat = value;
  }

  onTimeFormatChange(value: string): void {
    this.selectedTimeFormat = value as '12h' | '24h';
  }

  getDatePreview(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { timeZone: this.selectedTimezone, day: '2-digit', month: '2-digit', year: 'numeric' };
    const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(now);
    const day = parts.find(p => p.type === 'day')?.value ?? '';
    const month = parts.find(p => p.type === 'month')?.value ?? '';
    const year = parts.find(p => p.type === 'year')?.value ?? '';
    switch (this.selectedDateFormat) {
      case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
      default: return `${day}/${month}/${year}`;
    }
  }

  getTimePreview(): string {
    const now = new Date();
    return new Intl.DateTimeFormat('en-US', {
      timeZone: this.selectedTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: this.selectedTimeFormat === '12h'
    }).format(now);
  }

  saveDisplay(): void {
    this.saving.set(true);
    const data: DisplaySettings = {
      language: this.selectedLanguage,
      timezone: this.selectedTimezone,
      date_format: this.selectedDateFormat,
      time_format: this.selectedTimeFormat
    };
    this.settingsService.updateDisplay(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.displayService.update(data);
          this.alertDialogService.info({
            zTitle: 'Success',
            zDescription: 'Display settings updated successfully',
            zOkText: 'OK'
          });
        }
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: 'Failed to update display settings',
          zOkText: 'OK'
        });
      }
    });
  }

  // --- Notifications ---

  saveNotifications(): void {
    this.saving.set(true);
    const data: NotificationSettings = {
      email_notifications: this.emailNotifications,
      push_notifications: this.pushNotifications,
      notify_leave_approval: this.notifyLeaveApproval,
      notify_claim_approval: this.notifyClaimApproval,
      notify_payslip_ready: this.notifyPayslipReady,
      notify_memo_received: this.notifyMemoReceived,
      notify_policy_update: this.notifyPolicyUpdate
    };
    this.settingsService.updateNotifications(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.alertDialogService.info({
            zTitle: 'Success',
            zDescription: 'Notification settings updated successfully',
            zOkText: 'OK'
          });
        }
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: 'Failed to update notification settings',
          zOkText: 'OK'
        });
      }
    });
  }

  // --- Payslips ---

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.currentPage.set(1);
    this.loadPayslips();
  }

  loadPayslips(): void {
    this.loadingPayslips.set(true);
    this.personalService.getMyPayslips(
      this.selectedYear(),
      this.currentPage(),
      this.pageSize
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.payslips.set(response.data.payslips);
          this.ytdSummary.set(response.data.ytd_summary);
          if (response.data.pagination) {
            this.totalPages.set(response.data.pagination.totalPages);
            this.totalRecords.set(response.data.pagination.total);
          }
        }
        this.loadingPayslips.set(false);
      },
      error: () => {
        this.loadingPayslips.set(false);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: 'Failed to load payslips',
          zOkText: 'OK'
        });
      }
    });
  }

  downloadPayslip(payslip: MyPayslip): void {
    this.downloading.set(payslip.id);
    this.personalService.downloadPayslipPdf(payslip.id).subscribe({
      next: (blob: Blob) => {
        const filename = `Payslip_${payslip.year}_${String(payslip.month).padStart(2, '0')}.pdf`;
        this.downloadFile(blob, filename);
        this.downloading.set(null);
      },
      error: () => {
        this.downloading.set(null);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: 'Failed to download payslip',
          zOkText: 'OK'
        });
      }
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPayslips();
    }
  }

  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  }

  formatCurrency(amount: number): string {
    return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }

  getShowingTo(): number {
    return Math.min(this.currentPage() * this.pageSize, this.totalRecords());
  }

  // --- Change Password ---

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
    return this.passwordRequirements[index].check(this.newPassword);
  }

  isPasswordFormValid(): boolean {
    return (
      this.currentPassword.length > 0 &&
      this.passwordRequirements.every(req => req.check(this.newPassword)) &&
      this.newPassword === this.confirmPassword
    );
  }

  passwordsMatch(): boolean {
    return this.confirmPassword.length === 0 || this.newPassword === this.confirmPassword;
  }

  changePassword(): void {
    if (!this.isPasswordFormValid()) {
      this.alertDialogService.warning({
        zTitle: 'Validation Error',
        zDescription: 'Please fill in all fields correctly',
        zOkText: 'OK'
      });
      return;
    }

    this.savingPassword.set(true);

    this.settingsService.changePassword({
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
          this.resetPasswordForm();
        }
        this.savingPassword.set(false);
      },
      error: (error) => {
        this.savingPassword.set(false);
        const message = error.error?.message || 'Failed to change password';
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: message,
          zOkText: 'OK'
        });
      }
    });
  }

  // --- Profile Picture ---

  getInitials(): string {
    const name = this.accountInfo()?.employee_name || this.accountInfo()?.email || '';
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }

  onProfilePictureSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.alertDialogService.warning({
        zTitle: 'Invalid File',
        zDescription: 'Please select a JPG, PNG, or WebP image',
        zOkText: 'OK'
      });
      input.value = '';
      return;
    }

    // Validate file size (5MB max for source image before crop)
    if (file.size > 5 * 1024 * 1024) {
      this.alertDialogService.warning({
        zTitle: 'File Too Large',
        zDescription: 'Image must be under 5MB',
        zOkText: 'OK'
      });
      input.value = '';
      return;
    }

    this.openCropDialog(file);
    input.value = '';
  }

  private openCropDialog(file: File): void {
    this.dialogService.create({
      zTitle: 'Crop Profile Picture',
      zDescription: 'Drag to reposition. Use controls to zoom.',
      zContent: ProfilePictureCropDialogComponent,
      zData: { imageFile: file },
      zViewContainerRef: this.viewContainerRef,
      zWidth: '480px',
      zOkText: 'Save',
      zOkIcon: 'check',
      zCancelText: 'Cancel',
      zOnOk: (instance: ProfilePictureCropDialogComponent): false | void => {
        const croppedFile = instance.getCroppedFile();
        if (croppedFile) {
          this.uploadProfilePicture(croppedFile);
        } else {
          this.alertDialogService.warning({
            zTitle: 'Error',
            zDescription: 'Failed to crop image. Please try again.',
            zOkText: 'OK'
          });
          return false;
        }
      }
    });
  }

  private uploadProfilePicture(file: File): void {
    this.uploadingPhoto.set(true);
    this.settingsService.uploadProfilePicture(file).subscribe({
      next: (response) => {
        if (response.success) {
          const url = response.data.photo_url;
          const validUrl = url?.startsWith('http') ? url : null;
          const current = this.accountInfo();
          if (current) {
            this.accountInfo.set({ ...current, photo_url: validUrl });
          }
          // Update global profile state (sidebar, header, etc.)
          if (validUrl) {
            this.userProfileService.setProfilePicture(validUrl);
          }
          this.alertDialogService.info({
            zTitle: 'Success',
            zDescription: 'Profile picture updated successfully',
            zOkText: 'OK'
          });
        }
        this.uploadingPhoto.set(false);
      },
      error: (error) => {
        this.uploadingPhoto.set(false);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: error.error?.message || 'Failed to upload profile picture',
          zOkText: 'OK'
        });
      }
    });
  }

  removeProfilePicture(): void {
    this.removingPhoto.set(true);
    this.settingsService.removeProfilePicture().subscribe({
      next: (response) => {
        if (response.success) {
          const current = this.accountInfo();
          if (current) {
            this.accountInfo.set({ ...current, photo_url: null });
          }
          // Update global profile state (sidebar, header, etc.)
          this.userProfileService.clearProfilePicture();
        }
        this.removingPhoto.set(false);
      },
      error: () => {
        this.removingPhoto.set(false);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: 'Failed to remove profile picture',
          zOkText: 'OK'
        });
      }
    });
  }

  private resetPasswordForm(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordStrength.set({ score: 0, label: '', color: '' });
  }
}
