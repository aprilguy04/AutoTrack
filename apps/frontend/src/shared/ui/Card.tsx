import { type HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "elevated";
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", hover = true, className, children, ...props }, ref) => {
    const variants = {
      default: "bg-dark-800 border border-dark-700 shadow-md",
      glass: "glass",
      elevated: "bg-dark-800 shadow-xl shadow-dark-900/50 border border-dark-700",
    };

    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-2xl p-6 transition-all duration-300",
          variants[variant],
          hover && "hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

