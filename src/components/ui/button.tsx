import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]",
        gold: "bg-[var(--gold)] text-white font-semibold hover:bg-[var(--gold-dark)]",
        outline: "border border-[var(--border-strong)] text-[var(--text)] bg-transparent hover:bg-[var(--bg-alt)]",
        ghost: "text-[var(--text-secondary)] hover:bg-[var(--bg-alt)] hover:text-[var(--text)]",
        secondary: "bg-[var(--bg-alt)] text-[var(--text-secondary)] hover:bg-[var(--border)]",
        destructive: "bg-[var(--red)] text-white hover:opacity-90",
        link: "text-[var(--blue)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8",
        xl: "h-14 px-10",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
