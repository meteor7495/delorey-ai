import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer font-[inherit]',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-primary)] text-white border-none shadow-[var(--sh-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] active:scale-[0.98]',
        outline:
          'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border-color)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-1)]',
        ghost:
          'bg-transparent text-[var(--text-3)] border-none hover:bg-[var(--surface-3)] hover:text-[var(--text-2)]',
        warning:
          'bg-[var(--warning-bg)] text-[var(--warning)] border-none hover:opacity-90',
        destructive:
          'bg-[var(--danger-icon)] text-white border-none hover:opacity-90',
        success:
          'bg-[var(--success-icon)] text-white border-none hover:opacity-90',
        link:
          'bg-transparent text-[var(--color-primary-text)] border-none p-0 h-auto underline-offset-4 hover:underline',
      },
      size: {
        xs:       'h-7 px-3 text-xs rounded-[7px]',
        sm:       'h-8 px-3 text-[12px] rounded-[var(--r-xs)]',
        default:  'h-9 px-4 text-[13px] rounded-[var(--r-sm)]',
        lg:       'h-[38px] px-4 text-[13.5px] rounded-[var(--r-sm)]',
        icon:     'h-9 w-9 rounded-[var(--r-sm)]',
        'icon-sm':'h-[30px] w-[30px] rounded-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
