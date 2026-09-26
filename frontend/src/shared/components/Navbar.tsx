<<<<<<< HEAD
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
=======
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  const { t, i18n } = useTranslation('b2c');
  const navigate = useNavigate();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const currentLang = i18n.language;

  const handleLanguageChange = (lang: string) => {
    localStorage.setItem('clarity_lang', lang);
    i18n.changeLanguage(lang);
    setLangDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F1EDE9]/90 backdrop-blur-md border-b border-[#26382D]/8 transition-all w-full shrink-0">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
        
        {/* Logo / Wordmark */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] rounded-md"
            aria-label={t('accessibility.home', 'Green & Inclusive Travel Homepage')}
          >
            <div className="w-9 h-9 rounded-full bg-[#26382D] text-[#F8F6F3] flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-xs">
              <svg className="w-5 h-5 text-[#A9B8A3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.5 12 13 14 10" strokeDasharray="2 2"/>
              </svg>
            </div>
            <span className="font-serif text-2xl tracking-tight font-medium text-[#26382D]">
              Green &amp; Inclusive Travel
            </span>
          </button>
        </div>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-9 text-[15px] font-medium tracking-wide text-[#26382D]/85">
          <button 
            onClick={() => navigate('/')} 
            className="hover:text-[#26382D] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#26382D] hover:after:w-full after:transition-all cursor-pointer"
          >
            {t('home.nav.planTrip', 'Plan a Trip')}
          </button>
          <button 
            onClick={() => navigate('/explore/Goa')} 
            className="hover:text-[#26382D] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#26382D] hover:after:w-full after:transition-all cursor-pointer"
          >
            {t('home.nav.explore', 'Explore')}
          </button>
          <button 
            className="hover:text-[#26382D] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#26382D] hover:after:w-full after:transition-all cursor-pointer"
          >
            {t('home.nav.trips', 'Trips')}
          </button>
        </nav>

        {/* Right: For Businesses + Language Switcher */}
        <div className="hidden md:flex items-center gap-5 text-sm">
          <button
            className="text-[14px] font-medium text-[#26382D]/75 hover:text-[#26382D] transition-colors flex items-center gap-1.5 py-1.5 px-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] cursor-pointer"
          >
            <span>{t('home.nav.forBusinesses', 'For Businesses')}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#7C9278]" />
          </button>

          <span className="w-[1px] h-4 bg-[#D8C9BE]" aria-hidden="true" />

          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#26382D] text-xs font-semibold tracking-wider hover:bg-[#F8F6F3] border border-transparent hover:border-[#D8C9BE] transition-all focus:outline-none cursor-pointer"
              aria-label={t('accessibility.languageSelector', 'Language selector')}
            >
              <Globe className="w-3.5 h-3.5 text-[#7C9278]" />
              <span className="uppercase">{currentLang}</span>
              <span className="text-[#A99587] text-[10px]">▼</span>
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-[#F8F6F3] rounded-xl shadow-[0_8px_24px_rgba(38,56,45,0.08)] border border-[#D8C9BE] py-1.5 z-50 animate-in fade-in duration-150">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer ${
                    currentLang === 'en' ? 'bg-[#D8C9BE]/30 font-semibold text-[#26382D]' : 'text-[#26382D]/80 hover:bg-[#F1EDE9]'
                  }`}
                >
                  <span>English</span>
                  <span className="text-[11px] text-[#A99587]">EN</span>
                </button>
                <button
                  onClick={() => handleLanguageChange('hi')}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer ${
                    currentLang === 'hi' ? 'bg-[#D8C9BE]/30 font-semibold text-[#26382D]' : 'text-[#26382D]/80 hover:bg-[#F1EDE9]'
                  }`}
                >
                  <span>हिन्दी</span>
                  <span className="text-[11px] text-[#A99587]">HI</span>
                </button>
                <button
                  onClick={() => handleLanguageChange('mr')}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer ${
                    currentLang === 'mr' ? 'bg-[#D8C9BE]/30 font-semibold text-[#26382D]' : 'text-[#26382D]/80 hover:bg-[#F1EDE9]'
                  }`}
                >
                  <span>मराठी</span>
                  <span className="text-[11px] text-[#A99587]">MR</span>
                </button>
              </div>
            )}
          </div>
        </div>

>>>>>>> aa111b2cfb4203eaa795cc70e88e978dcbaec1f6
      </div>
    </header>
  );
}
