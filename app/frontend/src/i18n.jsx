import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Importe tes fichiers JSON
import translationEN from "./locales/en.json";
import translationFR from "./locales/fr.json";
import translationIT from "./locales/it.json";

const resources = {
  en: { translation: translationEN },
  fr: { translation: translationFR },
  it: { translation: translationIT },
};

i18n
  .use(initReactI18next) // Lie i18next à React
  .init({
    resources,
    lng: "fr",
    fallbackLng: "fr", // Langue par défaut
    interpolation: {
      escapeValue: false, // React protège déjà contre les attaques XSS
    },
  });

export default i18n;
