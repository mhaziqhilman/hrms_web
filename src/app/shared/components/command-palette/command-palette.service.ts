import { inject, Injectable, ViewContainerRef } from '@angular/core';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { ZardDialogRef } from '@/shared/components/dialog/dialog-ref';
import { CommandPaletteComponent } from './command-palette.component';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private dialogService = inject(ZardDialogService);
  private dialogRef: ZardDialogRef | null = null;

  open(viewContainerRef: ViewContainerRef): void {
    if (this.dialogRef) return;

    const ref = this.dialogService.create({
      zContent: CommandPaletteComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: true,
      zViewContainerRef: viewContainerRef,
      zCustomClasses: 'p-0 gap-0 max-w-[calc(100%-2rem)] sm:max-w-lg',
    });

    this.dialogRef = ref;

    // Wrap close() so our reference is cleared regardless of how the
    // dialog is dismissed (Escape, backdrop click, or programmatic).
    const originalClose = ref.close.bind(ref);
    ref.close = (result?: any) => {
      originalClose(result);
      this.dialogRef = null;
    };
  }

  close(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
  }
}
