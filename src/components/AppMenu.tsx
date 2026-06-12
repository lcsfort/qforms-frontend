"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, LifeBuoy, LogOut, Moon, Sun, User } from "lucide-react";
import { useRouter as useIntlRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useTheme, type Theme } from "@/lib/theme";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { logout } from "@/lib/redux/authSlice";
import { getUserAvatarUrl, getUserInitials } from "@/lib/userAvatar";

const LANGUAGE_LABELS: Record<string, string> = { en: "English", pt: "Português" };

const ITEM_BASE =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-[var(--foreground)] transition-colors duration-100 cursor-pointer";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="mx-3 my-1.5 border-t border-[var(--border)]/50" />;
}

export function AppMenu() {
  const t = useTranslations("appMenu");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextRouter = useRouter();
  const intlRouter = useIntlRouter();
  const dispatch = useAppDispatch();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    // Keep the query string (tabs, chat session ids) so page state survives the locale change.
    const query = searchParams.toString();
    nextRouter.push(segments.join("/") + (query ? `?${query}` : ""));
  };

  const handleSignOut = () => {
    setOpen(false);
    dispatch(logout());
    intlRouter.push("/");
  };

  const avatarUrl = user ? getUserAvatarUrl(user) : null;
  const initials = user ? getUserInitials(user) : "";
  const primaryLabel = user?.name?.trim() || user?.email;

  const themeOptions: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
    { value: "light", label: t("themeLight"), icon: Sun },
    { value: "dark", label: t("themeDark"), icon: Moon },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t("account")}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)]/70 transition-all duration-150 hover:border-[var(--primary)]/35 cursor-pointer"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={primaryLabel ?? ""} fill className="object-cover" unoptimized />
        ) : (
          <span className="text-[12px] font-semibold text-[var(--foreground)]">{initials}</span>
        )}
      </button>

      {open && (
        <div className="menu-enter absolute right-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-[var(--border)]/80 bg-[var(--card)] py-1.5 shadow-xl shadow-black/8 glass-panel dark:shadow-black/20">
          {user && (
            <>
              <div className="flex items-center gap-2.5 px-4 py-2.5">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)]">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <span className="text-[12px] font-semibold text-[var(--foreground)]">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold leading-tight text-[var(--foreground)]">
                    {primaryLabel}
                  </p>
                  {user.name && <p className="truncate text-[11px] text-[var(--muted)]">{user.email}</p>}
                </div>
              </div>
              <Divider />
            </>
          )}

          <div className="px-1.5">
            <button
              type="button"
              className={`${ITEM_BASE} hover:bg-[var(--surface)]/70`}
              onClick={() => {
                setOpen(false);
                intlRouter.push("/profile");
              }}
            >
              <User className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.8} />
              {t("profile")}
            </button>
            <button
              type="button"
              className={`${ITEM_BASE} hover:bg-[var(--surface)]/70`}
              onClick={() => setOpen(false)}
            >
              <LifeBuoy className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.8} />
              {t("help")}
            </button>
          </div>

          <Divider />

          <SectionLabel>{t("theme")}</SectionLabel>
          <div className="px-1.5">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  aria-pressed={active}
                  className={`${ITEM_BASE} ${active ? "bg-[var(--primary)]/8" : "hover:bg-[var(--surface)]/70"}`}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.8} />
                  <span className="flex-1">{option.label}</span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>

          <SectionLabel>{t("language")}</SectionLabel>
          <div className="px-1.5">
            {routing.locales.map((loc) => {
              const active = loc === locale;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => switchLocale(loc)}
                  aria-current={active ? "true" : undefined}
                  className={`${ITEM_BASE} ${active ? "bg-[var(--primary)]/8" : "hover:bg-[var(--surface)]/70"}`}
                >
                  <span className="w-4 shrink-0 text-center text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
                    {loc}
                  </span>
                  <span className="flex-1">{LANGUAGE_LABELS[loc] ?? loc}</span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>

          <Divider />

          <div className="px-1.5">
            <button
              type="button"
              onClick={handleSignOut}
              className={`${ITEM_BASE} hover:bg-red-500/[0.06] hover:text-red-500 dark:hover:bg-red-500/10`}
            >
              <LogOut className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.8} />
              {t("signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
