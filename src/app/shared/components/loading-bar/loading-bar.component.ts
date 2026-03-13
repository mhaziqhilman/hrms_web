import { Component, inject } from '@angular/core';
import { LoadingBarService } from '@/core/services/loading-bar.service';
import { ZardProgressBarComponent } from '@/shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-loading-bar',
  imports: [ZardProgressBarComponent],
  template: `
    @if (loadingBar.isLoading()) {
      <div class="fixed top-0 left-0 right-0 z-[9999]">
        <z-progress-bar
          zIndeterminate
          zShape="square"
          class="!h-[3px] !bg-primary/20"
          barClass="!bg-primary"
        />
      </div>
    }
  `,
})
export class LoadingBarComponent {
  protected loadingBar = inject(LoadingBarService);
}
