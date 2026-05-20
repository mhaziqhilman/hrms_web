import { cva, type VariantProps } from 'class-variance-authority';

import { mergeClasses } from '@/shared/utils/merge-classes';

/**
 * HRMS button system
 * ──────────────────────────────────────────────────────────────────────
 * Visual reference: dev_resources/design-ref/Policy View Variants.html
 *
 * The buttons are split into three classes so each role stays consistent
 * across the system:
 *
 *  1. SIDENAV BUTTON  →  zType="ghost"
 *     Quiet, chromeless button used by the side navigation. The nav items
 *     pin their label to 14px via `!text-sm` in main-layout.component.html
 *     so they keep their size while the default button sits at 13px.
 *
 *  2. DEFAULT BUTTON  →  zType="default"
 *     The primary call-to-action. Solid `--primary` surface with a white
 *     label — the clean slate-900 button from the design reference.
 *     `outline` / `secondary` / `destructive` / `link` are supporting
 *     roles tuned to sit next to it.
 *
 *  3. SMALL & LARGE   →  zSize="sm" | zSize="lg"
 *     Sizing scale derived from the default (`zSize="default"`) button —
 *     same proportions, padding and type rhythm, just scaled.
 *       sm       32px tall — table-row actions, compact toolbars
 *       default  36px tall — standard button (tuned to the design ref)
 *       lg       40px tall — prominent CTAs ("Acknowledge Policy")
 *
 * Every variant is built from theme tokens (`--primary`, `--border`,
 * `--muted`, …), so light & dark mode are handled automatically by the
 * palette in styles.css.
 */
export const buttonVariants = cva(
  mergeClasses(
    'cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium select-none',
    'transition-all duration-150 ease-out',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    'outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  ),
  {
    variants: {
      zType: {
        // DEFAULT — primary CTA. Solid surface, matches the design-ref button.
        // NOTE: press feedback is `active:scale` only — no `active:bg-*`, so a
        // `bg-*` class override (brand-coloured buttons) never flashes the theme colour.
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97]',
        // Dangerous / irreversible actions.
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 active:scale-[0.97] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        // Secondary action — hairline border, sits flat on the card surface.
        outline:
          'border border-border bg-card text-foreground hover:bg-muted/60 active:scale-[0.97] dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        // Low-emphasis filled action.
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.97]',
        // SIDENAV — quiet, chromeless button. Kept as-is for the side navigation.
        ghost: 'hover:bg-muted/60 dark:hover:bg-accent/50',
        // Inline, text-only button.
        link: 'text-primary underline-offset-4 hover:underline',
      },
      zSize: {
        // SMALL — scaled down from default: tighter type, gap and padding.
        sm: 'h-8 gap-1.5 px-3 text-xs data-icon-only:size-8 data-icon-only:p-0',
        // DEFAULT — standard button. 13px label, matching the design reference.
        default: 'h-9 px-4 py-2 text-[13px] data-icon-only:size-9 data-icon-only:p-0',
        // LARGE — scaled up from default: more presence, heavier label.
        lg: 'h-10 px-6 text-sm font-semibold data-icon-only:size-10 data-icon-only:p-0',
      },
      zShape: {
        default: 'rounded-md',
        circle: 'rounded-full',
        square: 'rounded-none',
      },
      zFull: {
        true: 'w-full',
      },
      zLoading: {
        true: 'opacity-50 pointer-events-none',
      },
      zDisabled: {
        true: 'pointer-events-none opacity-50',
      },
    },
    defaultVariants: {
      zType: 'default',
      zSize: 'default',
      zShape: 'default',
    },
  },
);
export type ZardButtonShapeVariants = NonNullable<VariantProps<typeof buttonVariants>['zShape']>;
export type ZardButtonSizeVariants = NonNullable<VariantProps<typeof buttonVariants>['zSize']>;
export type ZardButtonTypeVariants = NonNullable<VariantProps<typeof buttonVariants>['zType']>;
