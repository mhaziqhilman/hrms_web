import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

import { AuthService } from '@/core/services/auth.service';
import { NativeService } from '@/mobile/services/native.service';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import type { ZardIcon } from '@/shared/components/icon/icons';

interface TabItem {
  path: string;
  label: string;
  icon: ZardIcon;
}

@Component({
  selector: 'app-mobile-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ZardIconComponent],
  templateUrl: './mobile-shell.component.html',
  styleUrls: ['./mobile-shell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileShellComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  protected native = inject(NativeService);

  readonly user = this.auth.currentUserSignal;
  readonly unreadCount = signal<number>(0);
  readonly avatarFailed = signal(false);

  onAvatarError(): void {
    this.avatarFailed.set(true);
  }

  readonly leftTabs: TabItem[] = [
    { path: '/m/home', label: 'Home', icon: 'house' },
    { path: '/m/attendance', label: 'Attendance', icon: 'map-pin' },
  ];

  readonly rightTabs: TabItem[] = [
    { path: '/m/leave', label: 'Leave', icon: 'calendar' },
    { path: '/m/more', label: 'More', icon: 'ellipsis' },
  ];

  ngOnInit(): void {
    void this.native.initialize();
  }

  goToNotifications(): void {
    this.native.hapticLight();
    void this.router.navigateByUrl('/m/notifications');
  }

  goToProfile(): void {
    this.native.hapticLight();
    void this.router.navigateByUrl('/m/profile');
  }

  onTabTap(): void {
    this.native.hapticLight();
  }

  onFabTap(): void {
    this.native.hapticMedium();
    void this.router.navigateByUrl('/m/attendance');
  }
}
