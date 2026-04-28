export const UAT_USERS = {
  superAdmin: { email: 'admin@nextura.com',        password: 'Admin@1234', role: 'super_admin' },
  admin:      { email: 'uat.admin@nextura.test',   password: 'Uat@12345',  role: 'admin' },
  manager:    { email: 'uat.manager@nextura.test', password: 'Uat@12345',  role: 'manager' },
  staff:      { email: 'uat.staff@nextura.test',   password: 'Uat@12345',  role: 'staff' },
} as const;

export type UatRole = keyof typeof UAT_USERS;
