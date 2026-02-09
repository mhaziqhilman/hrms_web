// Settings Module Models

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  sidebar_collapsed: boolean;
  compact_mode: boolean;
  language: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  email_notifications: boolean;
  push_notifications: boolean;
  notify_leave_approval: boolean;
  notify_claim_approval: boolean;
  notify_payslip_ready: boolean;
  notify_memo_received: boolean;
  notify_policy_update: boolean;
  two_factor_enabled: boolean;
  session_timeout_minutes: number;
}

export interface AccountInfo {
  email: string;
  role: string;
  last_login: string;
  employee_name: string;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  sidebar_collapsed: boolean;
  compact_mode: boolean;
}

export interface DisplaySettings {
  language: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  notify_leave_approval: boolean;
  notify_claim_approval: boolean;
  notify_payslip_ready: boolean;
  notify_memo_received: boolean;
  notify_policy_update: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// API Response types
export interface SettingsResponse {
  success: boolean;
  data: UserSettings;
}

export interface AccountInfoResponse {
  success: boolean;
  data: AccountInfo;
}

export interface UpdateSettingsResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}
