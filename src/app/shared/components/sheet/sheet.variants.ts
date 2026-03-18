import { cva, type VariantProps } from 'class-variance-authority';

export const sheetOverlayVariants = cva(
  'fixed inset-0 z-50 bg-black/80'
);

export const sheetVariants = cva(
  'fixed z-50 flex flex-col gap-4 bg-background p-6 shadow-lg',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b',
        bottom: 'inset-x-0 bottom-0 border-t',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
        right: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

export type ZardSheetVariants = VariantProps<typeof sheetVariants>;
export type SheetSide = NonNullable<ZardSheetVariants['side']>;
