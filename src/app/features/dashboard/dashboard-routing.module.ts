import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { StaffDashboardComponent } from './components/staff-dashboard/staff-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'staff', pathMatch: 'full' },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [roleGuard(['super_admin', 'admin'])] },
  { path: 'manager', component: ManagerDashboardComponent, canActivate: [roleGuard(['super_admin', 'admin', 'manager'])] },
  { path: 'staff', component: StaffDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
