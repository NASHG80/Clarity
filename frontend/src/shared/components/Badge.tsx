import React from 'react';

export interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'demo';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, icon, className = '' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase';
  
  const variants = {
    neutral: 'bg-[#E5E5E5] text-[#525252]',
    success: 'bg-[#7C9278]/15 text-[#7C9278]',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    demo: 'bg-[#E8CFC4]/30 text-[#A95934]', // Adjusted orange/peach tone for demo
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{icon}</span>}
      {children}
    </span>
  );
}
