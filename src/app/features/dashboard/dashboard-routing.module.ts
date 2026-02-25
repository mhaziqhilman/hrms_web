import { NgModule, inject } from '@angular/core';
import { RouterModule, Routes, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';
import { AuthService } from '@/core/services/auth.service';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { StaffDashboardComponent } from './components/staff-dashboard/staff-dashboard.component';

/**
 * Redirects user to the correct dashboard based on their role
 */
const dashboardRedirectGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUserValue();

  if (user?.role === 'super_admin' || user?.role === 'admin') {
    router.navigate(['/dashboard/admin']);
  } else if (user?.role === 'manager') {
    router.navigate(['/dashboard/manager']);
  } else {
    router.navigate(['/dashboard/staff']);
  }
  return false;
};

const routes: Routes = [
  { path: '', canActivate: [dashboardRedirectGuard], component: StaffDashboardComponent, pathMatch: 'full' },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [roleGuard(['super_admin', 'admin'])] },
  { path: 'manager', component: ManagerDashboardComponent, canActivate: [roleGuard(['super_admin', 'manager'])] },
  { path: 'staff', component: StaffDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
