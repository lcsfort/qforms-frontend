"use client";

import type { Dispatch, SetStateAction } from "react";
import type { FormSettings, RenderKitDocument } from "@/lib/types";
import { PublishingSection } from "./PublishingSection";
import { AccessControlSection } from "./AccessControlSection";
import { ShareDistributionSection } from "./ShareDistributionSection";
import { NotificationsSection } from "./NotificationsSection";
import { SubmissionSection } from "./SubmissionSection";

type SettingsT = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

interface SettingsPanelProps {
  settings: FormSettings;
  setSettings: Dispatch<SetStateAction<FormSettings>>;
  schema: RenderKitDocument;
  formId: string;
  status: "draft" | "published";
  shareUrl: string;
  token: string | null;
  userEmail?: string | null;
  onPublishNow: () => Promise<void> | void;
  onSaveSchedule: () => Promise<void> | void;
  onUnpublish: () => Promise<void> | void;
  t: SettingsT;
}

export function SettingsPanel({
  settings,
  setSettings,
  schema,
  formId,
  status,
  shareUrl,
  token,
  userEmail,
  onPublishNow,
  onSaveSchedule,
  onUnpublish,
  t,
}: SettingsPanelProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PublishingSection
        settings={settings}
        setSettings={setSettings}
        status={status}
        onPublishNow={onPublishNow}
        onSaveSchedule={onSaveSchedule}
        onUnpublish={onUnpublish}
        t={t}
      />
      <AccessControlSection
        settings={settings}
        setSettings={setSettings}
        schema={schema}
        userEmail={userEmail}
        t={t}
      />
      <ShareDistributionSection
        shareUrl={shareUrl}
        formId={formId}
        status={status}
        token={token}
        t={t}
      />
      <NotificationsSection
        settings={settings}
        setSettings={setSettings}
        t={t}
      />
      <SubmissionSection
        settings={settings}
        setSettings={setSettings}
        t={t}
      />
    </div>
  );
}
