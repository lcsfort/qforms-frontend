"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { fetchProfile } from "@/lib/redux/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { DashboardShell } from "@/components/DashboardShell";
import { TemplateCard } from "../_components/TemplateCard";
import { TEMPLATE_IDS } from "../_lib/templates";
import { useTemplateCreator } from "../_lib/useTemplateCreator";

export default function TemplatesPage() {
  const t = useTranslations("dashboard.templates");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, hydrated } = useAppSelector((state) => state.auth);
  const { creatingId, error, createFromTemplate } = useTemplateCreator();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push("/signin");
      return;
    }
    if (user && !user.isEmailVerified) {
      router.push("/verify-email-required");
      return;
    }
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [hydrated, token, user, dispatch, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardShell
      showSearch={false}
      contentContainerClassName="w-full"
      mainClassName="dashboard-main-scroll flex-1 overflow-y-auto px-5 sm:px-8 lg:px-10 pt-[88px] pb-16 bg-[var(--background)]/70"
    >
      <div className="mb-7">
        <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-[28px]">
          {t("title")}
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--muted)]">{t("subtitle")}</p>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {TEMPLATE_IDS.map((id) => (
          <TemplateCard
            key={id}
            id={id}
            busy={creatingId === id}
            disabled={creatingId !== null}
            onUse={(templateId, payload) => void createFromTemplate(templateId, payload)}
          />
        ))}
      </div>
    </DashboardShell>
  );
}
