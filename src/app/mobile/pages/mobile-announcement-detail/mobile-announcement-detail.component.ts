import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MemoService } from '@/features/communication/services/memo.service';
import type { Memo } from '@/features/communication/models/memo.model';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { MobileEmptyStateComponent } from '@/mobile/shared/mobile-empty-state.component';

@Component({
  selector: 'app-mobile-announcement-detail',
  standalone: true,
  imports: [CommonModule, ZardIconComponent, MobileEmptyStateComponent],
  template: `
    <section class="space-y-4">
      <!-- Back header -->
      <div class="flex items-center gap-2 pb-1">
        <button
          type="button"
          (click)="goBack()"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 active:scale-95 transition dark:bg-neutral-800 dark:text-neutral-200"
          aria-label="Back"
        >
          <z-icon zType="arrow-left" zSize="default"></z-icon>
        </button>
        <h1 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">Announcement details</h1>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          <div class="h-12 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"></div>
          <div class="h-40 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
        </div>
      } @else if (!memo()) {
        <app-mobile-empty-state icon="send" title="Announcement not found" subtitle="It may have been archived or removed." />
      } @else {
        @if (memo(); as m) {
          <article
            class="rounded-2xl border bg-white p-4 dark:bg-neutral-900"
            [class]="m.is_pinned
              ? 'border-violet-200 dark:border-violet-900/50'
              : 'border-neutral-200 dark:border-neutral-800'"
          >
            @if (m.is_pinned) {
              <div class="mb-3 flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                <z-icon zType="pin" zSize="sm"></z-icon>
                <span>Pinned announcement</span>
              </div>
            }

            <!-- Profile -->
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
                [class]="avatarGradient(m.author?.employee?.full_name || 'U')"
              >
                @if (m.author?.employee?.photo_url) {
                  <img [src]="m.author!.employee!.photo_url" [alt]="m.author?.employee?.full_name" class="h-full w-full object-cover" />
                } @else {
                  <span>{{ initials(m.author?.employee?.full_name || m.author?.email || 'U') }}</span>
                }
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {{ m.author?.employee?.full_name || m.author?.email || 'Unknown' }}
                </div>
                <div class="truncate text-xs text-neutral-500">{{ subtitle(m) }}</div>
              </div>
            </div>

            <!-- Title + content -->
            <h2 class="mt-4 text-lg font-semibold leading-snug text-neutral-900 dark:text-neutral-50">
              {{ m.title }}
            </h2>

            @if (m.summary) {
              <p class="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">{{ m.summary }}</p>
            }

            <div
              class="prose prose-sm mt-3 max-w-none text-sm leading-relaxed text-neutral-700 dark:prose-invert dark:text-neutral-300"
              [innerHTML]="m.content"
            ></div>

            <div class="mt-4 flex items-center gap-3 text-xs text-neutral-500">
              <span class="inline-flex items-center gap-1">
                <z-icon zType="eye" zSize="sm"></z-icon>
                {{ m.view_count }} {{ m.view_count === 1 ? 'view' : 'views' }}
              </span>
              @if (m.acknowledgment_count > 0) {
                <span class="h-1 w-1 rounded-full bg-neutral-300"></span>
                <span class="inline-flex items-center gap-1">
                  <z-icon zType="check" zSize="sm"></z-icon>
                  {{ m.acknowledgment_count }} acknowledged
                </span>
              }
            </div>

            @if (m.requires_acknowledgment) {
              <div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                <div class="flex items-center gap-1.5 font-semibold">
                  <z-icon zType="circle-alert" zSize="sm"></z-icon>
                  Acknowledgment required
                </div>
                <p class="mt-1 opacity-80">Please read this announcement carefully.</p>
              </div>
            }
          </article>
        }
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileAnnouncementDetailComponent implements OnInit {
  private memoService = inject(MemoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly memo = signal<Memo | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.memoService.getMemoById(id).subscribe({
      next: (res: any) => {
        this.memo.set(res?.data || null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['/m/announcements']);
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

  formatDate(s?: string): string {
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
