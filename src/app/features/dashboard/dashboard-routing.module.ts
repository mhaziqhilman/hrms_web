import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardLayoutComponent } from './components/shared/dashboard-layout.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { StaffDashboardComponent } from './components/staff-dashboard/staff-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      { path: '', redirectTo: 'staff', pathMatch: 'full' },
      { path: 'admin', component: AdminDashboardComponent },
      { path: 'manager', component: ManagerDashboardComponent },
      { path: 'staff', component: StaffDashboardComponent },
      {
        path: 'employees',
        loadChildren: () => import('../employees/employees.routes').then(m => m.EMPLOYEES_ROUTES)
      },
      {
        path: 'payroll',
        loadChildren: () => import('../payroll/payroll.routes').then(m => m.PAYROLL_ROUTES)
      },
      {
        path: 'leave',
        loadChildren: () => import('../leave/leave.routes').then(m => m.LEAVE_ROUTES)
      },
      {
        path: 'attendance',
        loadChildren: () => import('../attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES)
      },
      {
        path: 'claims',
        loadChildren: () => import('../claims/claims.routes').then(m => m.CLAIMS_ROUTES)
      },
      {
        path: 'communication',
        loadChildren: () => import('../communication/communication.routes').then(m => m.COMMUNICATION_ROUTES)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
