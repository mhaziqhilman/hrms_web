import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardLayoutComponent } from './components/shared/dashboard-layout.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { StaffDashboardComponent } from './components/staff-dashboard/staff-dashboard.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    DashboardRoutingModule,
    DashboardLayoutComponent,
    AdminDashboardComponent,
    ManagerDashboardComponent,
    StaffDashboardComponent
  ]
})
export class DashboardModule { }
