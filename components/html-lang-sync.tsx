"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

// Il <html> sta nel layout radice (lang="it" fisso, così le pagine pubbliche
// restano statiche): dopo l'idratazione allinea `lang` alla locale della pagina
// perché screen reader e traduzione automatica del browser leggano `en` su /en.
export function HtmlLangSync() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
    // Uscendo dall'area pubblica (layout radice persistente) si torna a "it".
    return () => {
      document.documentElement.lang = "it";
    };
  }, [locale]);
  return null;
}
