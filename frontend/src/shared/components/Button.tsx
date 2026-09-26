import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl';

    const variants = {
      primary: 'bg-[#26382D] text-[#F8F6F3] hover:bg-[#26382D]/90',
      secondary: 'bg-[#7C9278] text-[#F8F6F3] hover:bg-[#7C9278]/90',
      outline: 'border-2 border-[#26382D] text-[#26382D] hover:bg-[#26382D]/5',
      ghost: 'text-[#26382D] hover:bg-[#26382D]/5',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    const sizes = {
      sm: 'h-9 px-4 text-xs',
      md: 'h-11 px-6 text-sm',
      lg: 'h-14 px-8 text-base',
      icon: 'h-11 w-11 p-0',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
