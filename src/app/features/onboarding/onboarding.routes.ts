import { Routes } from '@angular/router';
import { OnboardingChoiceComponent } from './components/onboarding-choice/onboarding-choice.component';
import { CompanySetupWizardComponent } from './components/company-setup-wizard/company-setup-wizard.component';
import { WaitForInvitationComponent } from './components/wait-for-invitation/wait-for-invitation.component';

export const ONBOARDING_ROUTES: Routes = [
  { path: '', component: OnboardingChoiceComponent },
  { path: 'setup', component: CompanySetupWizardComponent },
  { path: 'waiting', component: WaitForInvitationComponent }
];
