/**
 * API Configuration
 * Centralized API endpoint configuration
 */

export const API_CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:3000/api',
  endpoints: {
    auth: {
      register: '/auth/register',
      login: '/auth/login',
      logout: '/auth/logout',
      me: '/auth/me',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
      changePassword: '/auth/change-password'
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
      myPayslips: '/payroll/my-payslips'
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
