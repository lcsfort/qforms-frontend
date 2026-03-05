import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { ReduxProvider } from "@/lib/redux/provider";
import { ThemeProvider } from "@/lib/theme";
import { LocaleHtmlLang } from "@/components/LocaleHtmlLang";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "QForms — AI-Powered Form Builder",
  description:
    "Describe what you need, and AI generates a polished form in seconds. Like Google Forms, but smarter.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ReduxProvider>
        <ThemeProvider>
          <LocaleHtmlLang />
          {children}
        </ThemeProvider>
      </ReduxProvider>
    </NextIntlClientProvider>
  );
}
