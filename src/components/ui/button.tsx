import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-foreground/80 shadow-sm hover:brightness-95 transition-all bg-[var(--pastel-blue)]",
        destructive: "text-foreground/80 shadow-sm hover:brightness-95 transition-all bg-[var(--pastel-pink)]",
        outline:
          "border border-foreground/15 text-foreground/80 shadow-sm hover:brightness-95 transition-all bg-[var(--pastel-cream)]",
        secondary: "text-foreground/80 shadow-sm hover:brightness-95 transition-all bg-[var(--pastel-mint)]",
        ghost: "text-foreground/80 hover:bg-[var(--pastel-cream)] transition-colors",
        link: "text-foreground/80 underline-offset-4 hover:underline",
        hero: "text-foreground/80 font-semibold shadow-sm hover:brightness-95 transition-all bg-[var(--pastel-yellow)]",
        neon: "text-foreground/80 shadow-sm hover:brightness-95 transition-all bg-[var(--pastel-lavender)]",
        violet: "text-foreground/80 font-semibold shadow-sm hover:brightness-95 transition-all bg-[var(--pastel-peach)]",
        glass: "glass text-foreground/80 hover:bg-[var(--pastel-cream)] transition-all",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-xl px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
