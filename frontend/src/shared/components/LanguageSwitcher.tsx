import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from './Button';

export type SupportedLanguage = 'en' | 'hi' | 'mr';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
};

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = (i18n.language as SupportedLanguage) || 'en';

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        // Return focus to the button (simplified focus management)
        const button = dropdownRef.current?.querySelector('button');
        if (button) button.focus();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const changeLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('preferredLanguage', lang);
    } catch (e) {
      // Safely ignore if localStorage is unavailable
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        aria-label={t('selectLanguage', 'Select Language')}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="text-[#26382D]/80 hover:text-[#26382D] focus-visible:ring-[#7C9278]"
      >
        <Globe className="w-5 h-5 sm:mr-1.5" />
        <span className="hidden sm:inline-block font-medium mr-1 text-[#26382D]">
          {LANGUAGE_LABELS[currentLang] || 'English'}
        </span>
        <ChevronDown className={`hidden sm:block w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-32 origin-top-right rounded-xl bg-[#F8F6F3] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-[#D8C9BE]/50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {(Object.keys(LANGUAGE_LABELS) as SupportedLanguage[]).map((lang) => {
              const isSelected = currentLang === lang;
              return (
                <button
                  key={lang}
                  role="menuitem"
                  className={`w-full text-left px-4 py-2 text-sm transition-colors focus:outline-none focus:bg-[#F1EDE9]
                    ${isSelected ? 'bg-[#7C9278]/10 text-[#7C9278] font-medium' : 'text-[#26382D] hover:bg-[#F1EDE9]'}
                  `}
                  onClick={() => changeLanguage(lang)}
                >
                  <span className="flex items-center justify-between">
                    {LANGUAGE_LABELS[lang]}
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#7C9278]" aria-hidden="true" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
