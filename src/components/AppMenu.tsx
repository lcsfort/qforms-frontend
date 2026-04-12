"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTheme, type Theme } from "@/lib/theme";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { logout } from "@/lib/redux/authSlice";
import Image from "next/image";
import { useRouter as useIntlRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getUserAvatarUrl, getUserInitials } from "@/lib/userAvatar";

const flags: Record<string, string> = { en: "🇺🇸", pt: "🇧🇷" };
const langLabels: Record<string, string> = { en: "English", pt: "Português" };

function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
  danger,
  active,
}: {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg transition-colors duration-100 cursor-pointer ${
        active
          ? "bg-[var(--primary)]/8 text-[var(--primary)]"
          : danger
            ? "text-red-500 hover:bg-red-500/[0.06] dark:hover:bg-red-500/10"
            : "text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.04]"
      }`}
    >
      <span className="w-4 h-4 flex items-center justify-center shrink-0 opacity-60">
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="text-[10px] text-[var(--muted)]/60 font-mono border border-[var(--border)] rounded px-1 py-px">
          {shortcut}
        </span>
      )}
    </button>
  );
}

function Divider() {
  return <div className="my-1.5 border-t border-[var(--border)]/50" />;
}

function ThemeRow({ theme, setTheme, label }: { theme: Theme; setTheme: (t: Theme) => void; label: string }) {
  const options: { value: Theme; icon: ReactNode; name: string }[] = [
    {
      value: "light",
      name: "Light",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ),
    },
    {
      value: "dark",
      name: "Dark",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="px-3 py-2">
      <span className="text-[11px] font-medium text-[var(--muted)]/70 uppercase tracking-wider">{label}</span>
      <div className="flex gap-1 mt-2 p-0.5 rounded-lg bg-[var(--foreground)]/[0.03] dark:bg-[var(--foreground)]/[0.04]">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-100 cursor-pointer ${
              theme === opt.value
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {opt.icon}
            <span>{opt.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LanguageRow({ label }: { label: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
    setOpen(false);
  };

  return (
    <div className="px-3 py-2" ref={ref}>
      <span className="text-[11px] font-medium text-[var(--muted)]/70 uppercase tracking-wider">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-2 w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--foreground)]/[0.02] transition-colors duration-100 text-[13px] cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm leading-none">{flags[locale]}</span>
          <span>{langLabels[locale]}</span>
        </span>
        <svg
          className={`w-3 h-3 text-[var(--muted)]/60 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="mt-1 rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-md">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => switchLocale(loc)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors duration-100 cursor-pointer ${
                loc === locale
                  ? "bg-[var(--primary)]/8 text-[var(--primary)]"
                  : "text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.03]"
              }`}
            >
              <span className="text-sm leading-none">{flags[loc]}</span>
              <span>{langLabels[loc]}</span>
              {loc === locale && (
                <svg className="w-3.5 h-3.5 ml-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppMenu() {
  const t = useTranslations("appMenu");
  const dispatch = useAppDispatch();
  const intlRouter = useIntlRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSignOut = () => {
    setOpen(false);
    dispatch(logout());
    intlRouter.push("/");
  };

  const avatarUrl = user ? getUserAvatarUrl(user) : null;
  const initials = user ? getUserInitials(user) : "";
  const primaryLabel = user?.name?.trim() || user?.email;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--foreground)]/[0.03] transition-colors duration-100 cursor-pointer"
      >
        <svg
          className="w-4 h-4 text-[var(--foreground)]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl border border-[var(--border)]/80 bg-[var(--card)] glass-panel shadow-xl shadow-black/8 dark:shadow-black/20 z-50 py-1.5 menu-enter">
          {user && (
            <>
              <div className="mx-2 px-3 py-2.5 flex items-center gap-2.5 rounded-lg">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center justify-center relative">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={primaryLabel ?? "User"} fill className="object-cover" unoptimized />
                  ) : (
                    <span className="text-[11px] font-semibold text-[var(--foreground)]">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--foreground)] truncate leading-tight">
                    {primaryLabel}
                  </p>
                  {user.name && (
                    <p className="text-[11px] text-[var(--muted)] truncate">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <Divider />
            </>
          )}

          <div className="px-1.5">
            <MenuItem
              icon={
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              }
              label={t("profile")}
              onClick={() => { setOpen(false); intlRouter.push("/profile"); }}
            />
            <MenuItem
              icon={
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              }
              label={t("help")}
              shortcut="?"
              onClick={() => setOpen(false)}
            />
          </div>

          <Divider />

          <div className="px-1.5">
            <MenuItem
              icon={
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              }
              label={t("signOut")}
              onClick={handleSignOut}
              danger
            />
          </div>

          <Divider />

          <ThemeRow theme={theme} setTheme={setTheme} label={t("theme")} />

          <Divider />

          <LanguageRow label={t("language")} />
        </div>
      )}
    </div>
  );
}
