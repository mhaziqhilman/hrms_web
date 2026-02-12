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
      resendVerification: '/auth/resend-verification'
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
      ytd: (id: number) => `/employees/${id}/ytd`,
      detail: (id: number) => `/employees/${id}`,
      me: '/employees/me'
    },
    payroll: {
      base: '/payroll',
      calculate: '/payroll/calculate',
      detail: (id: number) => `/payroll/${id}`,
      submit: (id: number) => `/payroll/${id}/submit`,
      approve: (id: number) => `/payroll/${id}/approve`,
      markPaid: (id: number) => `/payroll/${id}/mark-paid`,
      payslip: (id: number) => `/payroll/${id}/payslip`,
      permanentDelete: (id: number) => `/payroll/${id}/permanent`,
      myPayslips: '/payroll/my-payslips',
      bulkSubmit: '/payroll/bulk-submit',
      bulkApprove: '/payroll/bulk-approve',
      bulkMarkPaid: '/payroll/bulk-mark-paid',
      bulkCancel: '/payroll/bulk-cancel',
      bulkDelete: '/payroll/bulk-delete'
    },
    leaves: {
      base: '/leaves',
      detail: (id: number) => `/leaves/${id}`,
      approveReject: (id: number) => `/leaves/${id}/approve-reject`,
      balance: (employee_id: number) => `/leaves/balance/${employee_id}`
    },
    attendance: {
      base: '/attendance',
      clockIn: '/attendance/clock-in',
      clockOut: '/attendance/clock-out',
      detail: (id: number) => `/attendance/${id}`,
      summary: (employee_id: number) => `/attendance/summary/${employee_id}`,
      wfh: '/attendance/wfh',
      wfhApproveReject: (id: number) => `/attendance/wfh/${id}/approve-reject`
    },
    statutoryReports: {
      periods: '/statutory-reports/periods',
      eaEmployees: (year: number) => `/statutory-reports/ea/${year}/employees`,
      ea: (employeeId: number, year: number) => `/statutory-reports/ea/${employeeId}/${year}`,
      eaPdf: (employeeId: number, year: number) => `/statutory-reports/ea/${employeeId}/${year}/pdf`,
      epf: (year: number, month: number) => `/statutory-reports/epf/${year}/${month}`,
      epfPdf: (year: number, month: number) => `/statutory-reports/epf/${year}/${month}/pdf`,
      socso: (year: number, month: number) => `/statutory-reports/socso/${year}/${month}`,
      socsoPdf: (year: number, month: number) => `/statutory-reports/socso/${year}/${month}/pdf`,
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
export const USER_KEY = 'hrms_user';
