"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAppSelector } from "@/lib/redux/hooks";
import { SettingsCard, SettingsSection } from "./primitives";

export function WorkspaceSection() {
  const t = useTranslations("profile.workspaceSection");
  const tShell = useTranslations("shell");
  const tWorkspace = useTranslations("workspace");
  const { items, activeWorkspaceId } = useAppSelector((s) => s.workspace);
  const active = items.find((w) => w.id === activeWorkspaceId);

  return (
    <SettingsSection title={t("title")} description={t("desc")}>
      <SettingsCard>
        {active && (
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)]/80 bg-[var(--surface)]/70 text-[15px] font-semibold text-[var(--foreground)]">
              {active.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-[var(--foreground)]">{active.name}</p>
              <p className="truncate text-[11.5px] text-[var(--muted)]">
                {tWorkspace(`role.${active.role}`)}
              </p>
            </div>
          </div>
        )}
        <p className="mb-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-[var(--muted)]">
          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
          {t("hint")}
        </p>
        <Link
          href="/dashboard/workspace"
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)]/70 px-4 text-[13px] font-medium text-[var(--foreground)] transition-colors duration-150 hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/8 hover:text-[var(--primary)]"
        >
          {tShell("manageWorkspace")}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </SettingsCard>
    </SettingsSection>
  );
}
