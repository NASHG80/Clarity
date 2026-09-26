import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, User, Globe } from 'lucide-react';
import { Button } from './Button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export interface NavItem {
  label: string;
  href: string;
}

export interface NavbarProps {
  navItems?: NavItem[];
  brandName?: string;
  showLanguageSwitcherSlot?: boolean;
}

export function Navbar({ 
  navItems = [], 
  brandName = 'Green & Inclusive Travel',
  showLanguageSwitcherSlot = true
}: NavbarProps) {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-50 w-full bg-[#F1EDE9]/90 backdrop-blur-md border-b border-[#D8C9BE]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div className="flex-shrink-0 flex items-center">
            <NavLink to="/" className="font-serif text-xl sm:text-2xl font-medium text-[#26382D]">
              {brandName}
            </NavLink>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-[#7C9278] ${
                    isActive ? 'text-[#7C9278]' : 'text-[#26382D]/80'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {showLanguageSwitcherSlot && (
              <div id="language-switcher-slot" className="mr-2">
                <LanguageSwitcher />
              </div>
            )}
            
            <Button variant="outline" size="sm" leftIcon={<User className="w-4 h-4" />}>
              {t('common.signIn', 'Sign In')}
            </Button>
          </div>

          {/* Mobile Menu Button (Left intentionally minimal; actual mobile nav uses BottomNavBar for core routes) */}
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" aria-label={t('common.menu', 'Menu')}>
              <Menu className="w-6 h-6 text-[#26382D]" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
