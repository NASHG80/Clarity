import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enB2c from './en/b2c.json';
import hiB2c from './hi/b2c.json';
import mrB2c from './mr/b2c.json';
import enB2b from './en/b2b.json';
import hiB2b from './hi/b2b.json';
import mrB2b from './mr/b2b.json';

export const supportedLanguages = ["en", "hi", "mr"] as const;
export type SupportedLanguage = typeof supportedLanguages[number];

const PREFERRED_LANGUAGE_KEY = 'clarity_lang';

const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(PREFERRED_LANGUAGE_KEY);
    if (saved === 'en' || saved === 'hi' || saved === 'mr') {
      return saved as SupportedLanguage;
    }
  } catch (e) {
    // localStorage might be unavailable
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { 
        b2c: enB2c, 
        b2b: enB2b, 
        common: { 
          language: "Language", 
          selectLanguage: "Select Language" 
        } 
      },
      hi: { 
        b2c: hiB2c, 
        b2b: hiB2b, 
        common: { 
          language: "भाषा", 
          selectLanguage: "भाषा चुनें" 
        } 
      },
      mr: { 
        b2c: mrB2c, 
        b2b: mrB2b, 
        common: { 
          language: "भाषा", 
          selectLanguage: "भाषा निवडा" 
        } 
      },
    },
    defaultNS: 'b2c',
    ns: ['b2b', 'b2c', 'common'],
    fallbackNS: ['b2c', 'b2b', 'common'],
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React handles XSS
    },
  });

export default i18n;
