import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { StaffDashboardComponent } from './components/staff-dashboard/staff-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'staff', pathMatch: 'full' },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'manager', component: ManagerDashboardComponent },
  { path: 'staff', component: StaffDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
