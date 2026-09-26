import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowUpRight, Leaf, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
export interface NavItem {
  label: string;
  href: string;
}

export function Navbar({ navItems, brandName }: { navItems?: NavItem[], brandName?: string }) {
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
    <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto h-16 bg-[#F1EDE9]/95 backdrop-blur-md border border-[#26382D]/10 rounded-full flex items-center justify-between px-6 shadow-sm">
        
        {/* Logo / Wordmark */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9278] rounded-md"
            aria-label={t('accessibility.home', 'Green & Inclusive Travel Homepage')}
          >
            <div className="w-8 h-8 rounded-full bg-[#26382D] text-[#F8F6F3] flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-xs">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="font-serif text-xl tracking-tight font-medium text-[#26382D]">
              EcoWay
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
          <div className="relative mr-2">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#26382D] text-[11px] font-bold tracking-wider hover:bg-[#D8C9BE]/30 border border-transparent transition-all focus:outline-none cursor-pointer"
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

          <button
            onClick={() => navigate('/')}
            className="bg-[#26382D] text-white px-5 py-2.5 rounded-full text-[11px] font-bold tracking-wider flex items-center gap-2 hover:bg-[#1A261E] transition-colors"
          >
            START PLANNING <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
