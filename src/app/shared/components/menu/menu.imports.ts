import { ZardMenuContentDirective } from '@/shared/components/menu/menu-content.directive';
import { ZardMenuItemDirective } from '@/shared/components/menu/menu-item.directive';
import { ZardMenuLabelComponent } from '@/shared/components/menu/menu-label.component';
import { ZardMenuShortcutComponent } from '@/shared/components/menu/menu-shortcut.component';
import { ZardMenuDirective } from '@/shared/components/menu/menu.directive';

export const ZardMenuImports = [
  ZardMenuContentDirective,
  ZardMenuItemDirective,
  ZardMenuDirective,
  ZardMenuLabelComponent,
  ZardMenuShortcutComponent,
] as const;
