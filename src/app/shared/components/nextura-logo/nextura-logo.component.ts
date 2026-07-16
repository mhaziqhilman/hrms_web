import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Nextura brand logo — the "human network N" mark with optional wordmark.
 *
 * Colors follow the brand package (dev_resources/design-ref/Nextura Logo.html):
 * - Light theme: navy figures + gradient connectors, accent top-right figure.
 * - Dark theme (`.dark` on <html>): #C9D8F5 figures, flat #5B8DEF connectors.
 * - `mono`: single-color via currentColor, for colored/gradient tiles.
 */
@Component({
  selector: 'app-nextura-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="nx-logo" [style.gap.px]="markSize * 0.28">
      <svg
        [attr.width]="markSize"
        [attr.height]="markSize"
        viewBox="0 0 96 96"
        aria-hidden="true"
      >
        @if (mono) {
          <g stroke="currentColor" stroke-width="5.5" stroke-linecap="round" fill="none" opacity="0.95">
            <line x1="26" y1="40" x2="26" y2="56" />
            <line x1="30" y1="40" x2="66" y2="58" />
            <line x1="70" y1="40" x2="70" y2="56" />
          </g>
          <g fill="currentColor">
            <circle cx="26" cy="22" r="5.6" />
            <path d="M16.5 40 a9.5 7.5 0 0 1 19 0 Z" />
            <circle cx="26" cy="62" r="5.6" />
            <path d="M16.5 80 a9.5 7.5 0 0 1 19 0 Z" />
            <circle cx="70" cy="22" r="5.6" />
            <path d="M60.5 40 a9.5 7.5 0 0 1 19 0 Z" />
            <circle cx="70" cy="62" r="5.6" />
            <path d="M60.5 80 a9.5 7.5 0 0 1 19 0 Z" />
          </g>
        } @else {
          <defs>
            <linearGradient [attr.id]="gradId" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stop-color="#1B3A6B" />
              <stop offset="1" stop-color="#3D82F0" />
            </linearGradient>
          </defs>
          <g class="nx-light">
            <g [attr.stroke]="'url(#' + gradId + ')'" stroke-width="5.5" stroke-linecap="round" fill="none">
              <line x1="26" y1="40" x2="26" y2="56" />
              <line x1="30" y1="40" x2="66" y2="58" />
              <line x1="70" y1="40" x2="70" y2="56" />
            </g>
            <g fill="#1B3A6B">
              <circle cx="26" cy="22" r="5.6" />
              <path d="M16.5 40 a9.5 7.5 0 0 1 19 0 Z" />
              <circle cx="26" cy="62" r="5.6" />
              <path d="M16.5 80 a9.5 7.5 0 0 1 19 0 Z" />
              <circle cx="70" cy="62" r="5.6" />
              <path d="M60.5 80 a9.5 7.5 0 0 1 19 0 Z" />
            </g>
            <g fill="#2A6FDB">
              <circle cx="70" cy="22" r="6.4" />
              <path d="M60 40 a10 8 0 0 1 20 0 Z" />
            </g>
          </g>
          <g class="nx-dark">
            <g stroke="#5B8DEF" stroke-width="5.5" stroke-linecap="round" fill="none">
              <line x1="26" y1="40" x2="26" y2="56" />
              <line x1="30" y1="40" x2="66" y2="58" />
              <line x1="70" y1="40" x2="70" y2="56" />
            </g>
            <g fill="#C9D8F5">
              <circle cx="26" cy="22" r="5.6" />
              <path d="M16.5 40 a9.5 7.5 0 0 1 19 0 Z" />
              <circle cx="26" cy="62" r="5.6" />
              <path d="M16.5 80 a9.5 7.5 0 0 1 19 0 Z" />
              <circle cx="70" cy="62" r="5.6" />
              <path d="M60.5 80 a9.5 7.5 0 0 1 19 0 Z" />
            </g>
            <g fill="#5B8DEF">
              <circle cx="70" cy="22" r="6.4" />
              <path d="M60 40 a10 8 0 0 1 20 0 Z" />
            </g>
          </g>
        }
      </svg>
      @if (variant === 'lockup') {
        <span class="nx-word" [style.font-size.px]="textSize">Nextura</span>
        @if (tag) {
          <span class="nx-tag">{{ tag }}</span>
        }
      }
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .nx-logo {
        display: inline-flex;
        align-items: center;
      }
      .nx-word {
        font-family: 'Sora', ui-sans-serif, system-ui, sans-serif;
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1;
        color: #16294d;
      }
      .nx-tag {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted-foreground, #6b7a90);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: 999px;
        padding: 3px 9px;
      }
      .nx-dark {
        display: none;
      }
      /* Mono marks inherit currentColor; the two-tone mark swaps variants on .dark */
      :host-context(.dark) .nx-light {
        display: none;
      }
      :host-context(.dark) .nx-dark {
        display: inline;
      }
      :host-context(.dark) .nx-word {
        color: #eaf0fb;
      }
    `,
  ],
})
export class NexturaLogoComponent {
  private static nextId = 0;

  @Input() variant: 'lockup' | 'mark' = 'lockup';
  @Input() mono = false;
  @Input() markSize = 32;
  @Input() textSize = 22;
  @Input() tag?: string;

  /** Unique per instance so multiple logos on one page don't share gradient defs. */
  readonly gradId = `nx-grad-${NexturaLogoComponent.nextId++}`;
}
