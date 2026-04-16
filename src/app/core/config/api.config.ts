/**
 * API Configuration
 * Centralized API endpoint configuration
 */
import { environment } from '../../../environments/environment';

export const API_CONFIG = {
  baseUrl: environment.baseUrl,
  apiUrl: environment.apiUrl,
  endpoints: {
    auth: {
      register: '/auth/register',
      login: '/auth/login',
      logout: '/auth/logout',
      me: '/auth/me',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
      changePassword: '/auth/change-password',
      verifyEmail: '/auth/verify-email',
      resendVerification: '/auth/resend-verification',
      refreshToken: '/auth/refresh-token',
      googleLogin: '/auth/google',
      githubLogin: '/auth/github'
    },
    company: {
      setup: '/company/setup',
      me: '/company/me',
      all: '/company/all',
      myCompanies: '/company/my-companies',
      switch: '/company/switch',
      clearContext: '/company/clear-context',
      logo: '/company/logo'
    },
    invitations: {
      base: '/invitations',
      info: '/invitations/info',
      accept: '/invitations/accept',
      autoAccept: '/invitations/auto-accept',
      cancel: (id: number) => `/invitations/${id}/cancel`,
      resend: (id: number) => `/invitations/${id}/resend`
    },
    employees: {
      base: '/employees',
      statistics: '/employees/statistics',
      ytd: (id: number | string) => `/employees/${id}/ytd`,
      detail: (id: number | string) => `/employees/${id}`,
      me: '/employees/me',
      myTeam: '/employees/my-team'
    },
    payroll: {
      base: '/payroll',
      calculate: '/payroll/calculate',
      detail: (id: number | string) => `/payroll/${id}`,
      submit: (id: number | string) => `/payroll/${id}/submit`,
      approve: (id: number | string) => `/payroll/${id}/approve`,
      markPaid: (id: number | string) => `/payroll/${id}/mark-paid`,
      payslip: (id: number | string) => `/payroll/${id}/payslip`,
      downloadPayslipPdf: (id: number | string) => `/payroll/${id}/payslip/download`,
      sendPayslipEmail: (id: number | string) => `/payroll/${id}/payslip/send-email`,
      permanentDelete: (id: number | string) => `/payroll/${id}/permanent`,
      myPayslips: '/payroll/my-payslips',
      bulkSubmit: '/payroll/bulk-submit',
      bulkApprove: '/payroll/bulk-approve',
      bulkMarkPaid: '/payroll/bulk-mark-paid',
      bulkCancel: '/payroll/bulk-cancel',
      bulkDelete: '/payroll/bulk-delete'
    },
    leaves: {
      base: '/leaves',
      calendar: '/leaves/calendar',
      detail: (id: number | string) => `/leaves/${id}`,
      approveReject: (id: number | string) => `/leaves/${id}/approve-reject`,
      balance: (employee_id: number | string) => `/leaves/balance/${employee_id}`
    },
    attendance: {
      base: '/attendance',
      clockIn: '/attendance/clock-in',
      clockOut: '/attendance/clock-out',
      detail: (id: number | string) => `/attendance/${id}`,
      summary: (employee_id: number | string) => `/attendance/summary/${employee_id}`,
      wfh: '/attendance/wfh',
      wfhApproveReject: (id: number) => `/attendance/wfh/${id}/approve-reject`
    },
    statutoryReports: {
      periods: '/statutory-reports/periods',
      eaEmployees: (year: number) => `/statutory-reports/ea/${year}/employees`,
      ea: (employeeId: number | string, year: number) => `/statutory-reports/ea/${employeeId}/${year}`,
      eaPdf: (employeeId: number | string, year: number) => `/statutory-reports/ea/${employeeId}/${year}/pdf`,
      eaExcel: (employeeId: number | string, year: number) => `/statutory-reports/ea/${employeeId}/${year}/excel`,
      eaSendEmail: (employeeId: number | string, year: number) => `/statutory-reports/ea/${employeeId}/${year}/send-email`,
      eaBulkDownload: (year: number) => `/statutory-reports/ea/${year}/bulk-download`,
      epf: (year: number, month: number) => `/statutory-reports/epf/${year}/${month}`,
      epfPdf: (year: number, month: number) => `/statutory-reports/epf/${year}/${month}/pdf`,
      socso: (year: number, month: number) => `/statutory-reports/socso/${year}/${month}`,
      socsoPdf: (year: number, month: number) => `/statutory-reports/socso/${year}/${month}/pdf`,
      eis: (year: number, month: number) => `/statutory-reports/eis/${year}/${month}`,
      eisPdf: (year: number, month: number) => `/statutory-reports/eis/${year}/${month}/pdf`,
      pcb: (year: number, month: number) => `/statutory-reports/pcb/${year}/${month}`,
      pcbPdf: (year: number, month: number) => `/statutory-reports/pcb/${year}/${month}/pdf`,
      csv: (type: string, year: number, month: number) => `/statutory-reports/csv/${type}/${year}/${month}`
    },
    users: {
      base: '/users',
      detail: (id: number) => `/users/${id}`,
      updateRole: (id: number) => `/users/${id}/role`,
      toggleActive: (id: number) => `/users/${id}/toggle-active`,
      linkEmployee: (id: number) => `/users/${id}/link-employee`,
      unlinkEmployee: (id: number) => `/users/${id}/unlink-employee`,
      resetPassword: (id: number) => `/users/${id}/reset-password`,
      unlinkedEmployees: '/users/unlinked-employees'
    },
    dashboard: {
      admin: '/dashboard/admin',
      manager: '/dashboard/manager',
      staff: '/dashboard/staff'
    },
    analytics: {
      payrollCost: '/analytics/payroll-cost',
      leaveUtilization: '/analytics/leave-utilization',
      attendancePunctuality: '/analytics/attendance-punctuality',
      claimsSpending: '/analytics/claims-spending',
      dashboard: '/analytics/dashboard',
      exportExcel: '/analytics/export/excel',
      exportPdf: '/analytics/export/pdf'
    },
    leaveTypes: {
      base: '/leave-types',
      detail: (id: number) => `/leave-types/${id}`,
      toggle: (id: number) => `/leave-types/${id}/toggle`
    },
    leaveEntitlements: {
      base: '/leave-entitlements',
      detail: (id: number) => `/leave-entitlements/${id}`,
      initialize: '/leave-entitlements/initialize'
    },
    claimTypes: {
      base: '/claim-types',
      detail: (id: number) => `/claim-types/${id}`,
      toggle: (id: number) => `/claim-types/${id}/toggle`
    },
    publicHolidays: {
      base: '/public-holidays',
      detail: (id: number) => `/public-holidays/${id}`
    },
    statutoryConfig: {
      base: '/statutory-config'
    },
    emailTemplates: {
      base: '/email-templates',
      detail: (key: string) => `/email-templates/${key}`,
      preview: (key: string) => `/email-templates/${key}/preview`,
      reset: (key: string) => `/email-templates/${key}/reset`
    },
    emailConfig: {
      base: '/email-config',
      test: '/email-config/test'
    },
    files: {
      base: '/files',
      upload: '/files/upload',
      overview: '/files/overview',
      detail: (id: number) => `/files/${id}`,
      download: (id: number) => `/files/${id}/download`,
      preview: (id: number) => `/files/${id}/preview`,
      verify: (id: number) => `/files/${id}/verify`,
      bulkDelete: '/files/bulk-delete',
      myDocuments: '/files/my-documents',
      byEmployee: (id: number) => `/files/employee/${id}`,
      byClaim: (id: number) => `/files/claim/${id}`,
      stats: '/files/stats/storage'
    },
    announcements: {
      base: '/memos',
      detail: (id: number | string) => `/memos/${id}`,
      pinned: '/memos/pinned',
      togglePin: (id: number | string) => `/memos/${id}/toggle-pin`,
      acknowledge: (id: number | string) => `/memos/${id}/acknowledge`,
      statistics: (id: number | string) => `/memos/${id}/statistics`
    },
    announcementCategories: {
      base: '/announcement-categories',
      detail: (id: number) => `/announcement-categories/${id}`
    },
    notifications: {
      base: '/notifications',
      unreadCount: '/notifications/unread-count',
      markAllRead: '/notifications/mark-all-read',
      markAsRead: (id: number) => `/notifications/${id}/read`,
      detail: (id: number) => `/notifications/${id}`,
      deviceToken: '/notifications/device-token'
    },
    feedback: {
      base: '/feedback',
      stats: '/feedback/stats',
      my: '/feedback/my',
      detail: (id: number) => `/feedback/${id}`,
      updateStatus: (id: number) => `/feedback/${id}/status`,
    },
    auditLogs: {
      base: '/audit-logs'
    },
    invoices: {
      base: '/invoices',
      detail: (id: string) => `/invoices/${id}`,
      approve: (id: string) => `/invoices/${id}/approve`,
      submit: (id: string) => `/invoices/${id}/submit`,
      lhdnStatus: (id: string) => `/invoices/${id}/lhdn-status`,
      cancel: (id: string) => `/invoices/${id}/cancel`,
      payments: (id: string) => `/invoices/${id}/payments`,
      pdf: (id: string) => `/invoices/${id}/pdf`,
      analytics: '/invoices/analytics',
      generatePayroll: '/invoices/generate/payroll',
      generateClaim: '/invoices/generate/claim',
      bulkSubmit: '/invoices/bulk-submit',
      validateTin: '/invoices/validate-tin'
    },
    settings: {
      base: '/settings',
      account: '/settings/account',
      appearance: '/settings/appearance',
      display: '/settings/display',
      notifications: '/settings/notifications',
      changePassword: '/settings/change-password',
      twoFactor: {
        enable: '/settings/two-factor/enable',
        disable: '/settings/two-factor/disable'
      },
      reset: '/settings/reset'
    }
  }
};

export const TOKEN_KEY = 'hrms_token';
export const REFRESH_TOKEN_KEY = 'hrms_refresh_token';
export const USER_KEY = 'hrms_user';
