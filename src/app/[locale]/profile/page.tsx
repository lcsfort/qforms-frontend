"use client";

import { Suspense, useEffect, useMemo, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Bell, Lock, Palette, Sparkles, User as UserIcon, Users } from "lucide-react";
import { fetchProfile } from "@/lib/redux/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { DashboardShell } from "@/components/DashboardShell";
import { DangerSection } from "./_components/DangerSection";
import { AccountSection } from "./_components/AccountSection";
import { CreationSection } from "./_components/CreationSection";
import { InsightsSection } from "./_components/InsightsSection";
import { PreferencesSection } from "./_components/PreferencesSection";
import { SecuritySection } from "./_components/SecuritySection";
import { WorkspaceSection } from "./_components/WorkspaceSection";

type SectionId = "account" | "security" | "preferences" | "insights" | "creation" | "workspace";

type SectionEntry = {
  id: SectionId;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

function SettingsPageInner() {
  const t = useTranslations("profile");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, hydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push("/signin");
      return;
    }
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [hydrated, token, user, dispatch, router]);

  const sections = useMemo<SectionEntry[]>(() => {
    const entries: SectionEntry[] = [{ id: "account", icon: UserIcon }];
    if (user?.authProvider !== "google") {
      entries.push({ id: "security", icon: Lock });
    }
    entries.push(
      { id: "preferences", icon: Palette },
      { id: "insights", icon: Bell },
      { id: "creation", icon: Sparkles },
      { id: "workspace", icon: Users },
    );
    return entries;
  }, [user?.authProvider]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label={t("loading")}>
        <div
          aria-hidden="true"
          className="w-10 h-10 border-[3px] border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"
        />
      </div>
    );
  }

  // The tab lives in the URL so settings sections are linkable and survive reloads.
  // Invalid values (or "security" on a Google account) fall back to "account".
  const tabParam = searchParams.get("tab");
  const resolvedSection: SectionId = sections.some((s) => s.id === tabParam)
    ? (tabParam as SectionId)
    : "account";

  const selectSection = (id: SectionId) => {
    router.replace(id === "account" ? "/profile" : `/profile?tab=${id}`);
  };

  return (
    <DashboardShell
      contentContainerClassName="w-full"
      mainClassName="dashboard-main-scroll flex-1 overflow-y-auto px-5 sm:px-8 lg:px-10 pt-[88px] pb-16 bg-[var(--background)]/70"
    >
      <div className="mb-8">
        <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-[28px]">
          {t("title")}
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--muted)]">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:gap-10">
        <nav
          aria-label={t("title")}
          className="flex shrink-0 gap-1 overflow-x-auto pb-1 md:w-52 md:flex-col md:self-start md:overflow-visible md:pb-0 md:sticky md:top-[76px]"
        >
          {sections.map((section) => {
            const Icon = section.icon;
            const active = section.id === resolvedSection;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => selectSection(section.id)}
                aria-current={active ? "true" : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                  active
                    ? "border-[var(--border)]/80 bg-[var(--card)] font-medium text-[var(--foreground)] shadow-sm"
                    : "border-transparent text-[var(--muted)] hover:bg-[var(--surface)]/60 hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[var(--primary)]" : ""}`} strokeWidth={1.8} />
                {t(`nav.${section.id}`)}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 max-w-[920px] flex-1 pb-4">
          {resolvedSection === "account" && (
            <div className="space-y-10">
              <AccountSection user={user} token={token!} />
              <DangerSection user={user} token={token!} />
            </div>
          )}
          {resolvedSection === "security" && <SecuritySection token={token!} />}
          {resolvedSection === "preferences" && <PreferencesSection />}
          {resolvedSection === "insights" && <InsightsSection />}
          {resolvedSection === "creation" && <CreationSection />}
          {resolvedSection === "workspace" && <WorkspaceSection />}
        </div>
      </div>
    </DashboardShell>
  );
}

export default function SettingsPage() {
  // useSearchParams requires a Suspense boundary during prerendering.
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  );
}
