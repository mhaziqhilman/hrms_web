import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      zType: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary: 'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        'soft-gray': 'border-transparent bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
        'soft-red': 'border-transparent bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
        'soft-orange': 'border-transparent bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
        'soft-green': 'border-transparent bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
        'soft-blue': 'border-transparent bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
        'soft-purple': 'border-transparent bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
        'soft-pink': 'border-transparent bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
        'soft-yellow': 'border-transparent bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
      },
      zShape: {
        default: 'rounded-md',
        square: 'rounded-none',
        pill: 'rounded-full',
      },
    },
    defaultVariants: {
      zType: 'default',
      zShape: 'default',
    },
  },
);
export type ZardBadgeVariants = VariantProps<typeof badgeVariants>;
