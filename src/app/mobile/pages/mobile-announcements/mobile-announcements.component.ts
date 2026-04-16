import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MemoService } from '@/features/communication/services/memo.service';
import type { Memo } from '@/features/communication/models/memo.model';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';
import { MobileEmptyStateComponent } from '@/mobile/shared/mobile-empty-state.component';

@Component({
  selector: 'app-mobile-announcements',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardIconComponent,
    MobilePageHeaderComponent,
    MobileEmptyStateComponent,
  ],
  template: `
    <section class="space-y-5">
      <app-mobile-page-header title="Announcements" subtitle="Latest from your company" />

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-40 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
          }
        </div>
      } @else if (items().length === 0) {
        <app-mobile-empty-state icon="send" title="No announcements yet" subtitle="Company memos will appear here." />
      } @else {
        <div class="space-y-3">
          @for (memo of items(); track memo.id) {
            <a
              [routerLink]="['/m/announcements', memo.public_id || memo.id]"
              class="block rounded-2xl border bg-white p-4 transition active:scale-[0.99] dark:bg-neutral-900"
              [class]="memo.is_pinned
                ? 'border-violet-200 dark:border-violet-900/50'
                : 'border-neutral-200 dark:border-neutral-800'"
            >
              @if (memo.is_pinned) {
                <div class="mb-3 flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                  <z-icon zType="pin" zSize="sm"></z-icon>
                  <span>Pinned announcement</span>
                </div>
              }

              <!-- Profile row -->
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
                  [class]="avatarGradient(memo.author?.employee?.full_name || 'U')"
                >
                  @if (memo.author?.employee?.photo_url) {
                    <img [src]="memo.author!.employee!.photo_url" [alt]="memo.author?.employee?.full_name" class="h-full w-full object-cover" />
                  } @else {
                    <span>{{ initials(memo.author?.employee?.full_name || memo.author?.email || 'U') }}</span>
                  }
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {{ memo.author?.employee?.full_name || memo.author?.email || 'Unknown' }}
                  </div>
                  <div class="truncate text-xs text-neutral-500">
                    {{ subtitle(memo) }}
                  </div>
                </div>
              </div>

              <!-- Content -->
              <h3 class="mt-3 text-[15px] font-semibold leading-snug text-neutral-900 dark:text-neutral-50">
                {{ memo.title }}
              </h3>
              <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
                {{ memo.summary || stripHtml(memo.content) }}
              </p>

              <!-- Meta -->
              <div class="mt-3 flex items-center gap-3 text-[11px] text-neutral-500">
                <span class="inline-flex items-center gap-1">
                  <z-icon zType="eye" zSize="sm"></z-icon>
                  {{ memo.view_count }} {{ memo.view_count === 1 ? 'view' : 'views' }}
                </span>
                @if (memo.requires_acknowledgment) {
                  <span class="h-1 w-1 rounded-full bg-neutral-300"></span>
                  <span class="text-amber-700 dark:text-amber-400">Acknowledgment required</span>
                }
              </div>
            </a>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileAnnouncementsComponent implements OnInit {
  private memoService = inject(MemoService);

  readonly loading = signal(false);
  readonly items = signal<Memo[]>([]);

  ngOnInit(): void {
    this.loading.set(true);
    this.memoService.getAllMemos({ status: 'Published', limit: 20, sort_by: 'newest' } as any).subscribe({
      next: (res: any) => {
        this.items.set(res?.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  subtitle(m: Memo): string {
    const role = m.author?.employee?.position || m.author?.role || '';
    const date = this.formatDate(m.published_at || m.created_at);
    return role && date ? `${role} · ${date}` : role || date;
  }

  initials(name: string): string {
    if (!name) return 'U';
    return name
      .split(/[\s@]/)
      .filter((w) => w.length > 0)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  avatarGradient(name: string): string {
    const palettes = [
      'bg-gradient-to-br from-indigo-500 to-purple-600',
      'bg-gradient-to-br from-sky-500 to-blue-600',
      'bg-gradient-to-br from-emerald-500 to-teal-600',
      'bg-gradient-to-br from-rose-500 to-pink-600',
      'bg-gradient-to-br from-amber-500 to-orange-600',
      'bg-gradient-to-br from-violet-500 to-fuchsia-600',
    ];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return palettes[h % palettes.length];
  }

  stripHtml(s?: string): string {
    if (!s) return '';
    return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }

  formatDate(s?: string): string {
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
