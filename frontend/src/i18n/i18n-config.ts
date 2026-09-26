<<<<<<< HEAD
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

const PREFERRED_LANGUAGE_KEY = 'preferredLanguage';

const getInitialLanguage = (): SupportedLanguage => {
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
=======
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enB2C from "./en/b2c.json";
import hiB2C from "./hi/b2c.json";
import mrB2C from "./mr/b2c.json";
import enB2B from "./en/b2b.json";
import hiB2B from "./hi/b2b.json";
import mrB2B from "./mr/b2b.json";

export const supportedLanguages = ["en", "hi", "mr"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const savedLang = typeof window !== "undefined" ? localStorage.getItem("clarity_lang") : null;
const initialLang = savedLang && (supportedLanguages as readonly string[]).includes(savedLang) ? savedLang : "en";
>>>>>>> aa111b2cfb4203eaa795cc70e88e978dcbaec1f6

i18n
  .use(initReactI18next)
  .init({
    resources: {
<<<<<<< HEAD
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
    defaultNS: 'b2b',
    ns: ['b2b', 'b2c', 'common'],
    fallbackNS: ['b2b', 'b2c', 'common'],
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React handles XSS
=======
      en: { b2c: enB2C, b2b: enB2B },
      hi: { b2c: hiB2C, b2b: hiB2B },
      mr: { b2c: mrB2C, b2b: mrB2B },
    },
    lng: initialLang,
    fallbackLng: "en",
    defaultNS: "b2c",
    interpolation: {
      escapeValue: false,
>>>>>>> aa111b2cfb4203eaa795cc70e88e978dcbaec1f6
    },
  });

export default i18n;
