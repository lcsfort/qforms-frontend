"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

export function LocaleHtmlLang() {
  const params = useParams();
  const locale = params?.locale as string | undefined;

  useEffect(() => {
    if (locale && typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
