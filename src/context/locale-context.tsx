
'use client';

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import en from '@/locales/en.json';
import id from '@/locales/id.json';

const translations = { en, id };

type Locale = 'en' | 'id';

interface LocaleContextType {
  lang: Locale;
  setLang: (lang: Locale) => void;
  t: (key: string, options?: { [key: string]: string | number, returnObjects?: boolean }) => any;
}

export const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

function getTranslation(lang: Locale, key: string, options?: { [key: string]: string | number }) {
  const keyParts = key.split('.');
  let value: any = translations[lang];

  for (const part of keyParts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return key; // Return key if not found
    }
  }

  if (typeof value === 'string' && options) {
    Object.keys(options).forEach(optKey => {
      value = value.replace(`{{${optKey}}}`, String(options[optKey]));
    });
  }

  return value;
}


export const LocaleProvider = ({ children, lang: initialLang }: { children: ReactNode, lang: Locale }) => {
  const [lang, setLang] = useState<Locale>(initialLang);

  useEffect(() => {
    setLang(initialLang);
  }, [initialLang]);

  const t = (key: string, options?: { [key: string]: string | number, returnObjects?: boolean }) => {
    const keyParts = key.split('.');
    let value: any = translations[lang];
  
    for (const part of keyParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return key; // Return key if not found
      }
    }
  
    if (options?.returnObjects) {
      return value;
    }
  
    if (typeof value === 'string' && options) {
      Object.keys(options).forEach(optKey => {
        value = value.replace(`{{${optKey}}}`, String(options[optKey]));
      });
    }
  
    return value;
  };

  return (
    <LocaleContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LocaleContext.Provider>
  );
};
