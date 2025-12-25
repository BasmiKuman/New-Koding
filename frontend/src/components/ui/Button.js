import * as React from "react";
import { cn } from "../../lib/utils";

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-gradient-primary text-white hover:opacity-90 shadow-md",
    destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:opacity-90 shadow-md",
    outline: "border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
    secondary: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
    link: "text-blue-600 underline-offset-4 hover:underline",
    success: "bg-gradient-secondary text-white hover:opacity-90 shadow-md",
  };

  const sizes = {
    default: "h-11 px-5 py-2",
    sm: "h-9 px-4 text-sm",
    lg: "h-13 px-8 text-lg",
    icon: "h-11 w-11",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button };
