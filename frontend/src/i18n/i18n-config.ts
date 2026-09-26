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

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { b2c: enB2C, b2b: enB2B },
      hi: { b2c: hiB2C, b2b: hiB2B },
      mr: { b2c: mrB2C, b2b: mrB2B },
    },
    lng: initialLang,
    fallbackLng: "en",
    defaultNS: "b2c",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
