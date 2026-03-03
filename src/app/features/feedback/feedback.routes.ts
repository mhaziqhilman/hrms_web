import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/auth.guard';

export const FEEDBACK_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['super_admin'])],
    loadComponent: () => import('./components/feedback-list/feedback-list.component')
      .then(m => m.FeedbackListComponent),
    data: { title: 'Feedback' }
  }
];
