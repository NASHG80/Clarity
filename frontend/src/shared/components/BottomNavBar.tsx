import React from 'react';
import { NavLink } from 'react-router-dom';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

export interface BottomNavBarProps {
  items: BottomNavItem[];
}

export function BottomNavBar({ items }: BottomNavBarProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#F8F6F3] border-t border-[#D8C9BE]/50 pb-safe md:hidden shadow-[0_-4px_16px_rgba(38,56,45,0.05)]">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.href}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[#7C9278]' : 'text-[#26382D]/60 hover:text-[#26382D]'
              }`
            }
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {item.icon}
            </div>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
