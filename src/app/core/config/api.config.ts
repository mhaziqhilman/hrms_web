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
      resetPassword: '/auth/reset-password'
    },
    employees: {
      base: '/employees',
      statistics: '/employees/statistics',
      ytd: (id: number) => `/employees/${id}/ytd`,
      detail: (id: number) => `/employees/${id}`
    },
    payroll: {
      base: '/payroll',
      calculate: '/payroll/calculate',
      detail: (id: number) => `/payroll/${id}`,
      approve: (id: number) => `/payroll/${id}/approve`,
      markPaid: (id: number) => `/payroll/${id}/mark-paid`,
      payslip: (id: number) => `/payroll/${id}/payslip`
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
    }
  }
};

export const TOKEN_KEY = 'hrms_token';
export const USER_KEY = 'hrms_user';
