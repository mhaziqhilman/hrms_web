import { ZardIcon } from '@/shared/components/icon/icons';

export interface SidebarMenuItem {
  title: string;
  icon: ZardIcon;
  route?: string;
  action?: () => void;
  children?: SidebarMenuItem[];
  roles?: string[]; // For role-based access
}

export interface SidebarMenuGroup {
  label: string;
  items: SidebarMenuItem[];
  roles?: string[]; // For role-based group visibility
}
