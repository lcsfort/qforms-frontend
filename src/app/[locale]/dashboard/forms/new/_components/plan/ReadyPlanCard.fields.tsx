import { useTranslations } from "next-intl";
import type { FormField, FormSettings, GeneratedFormSchema } from "@/lib/types";
import { FieldTypeIcon } from "../icons/FieldTypeIcon";

type Props = {
  schema: GeneratedFormSchema;
};

export function ReadyPlanFieldList({ schema }: Props) {
  const t = useTranslations("forms.generate");
  const tft = useTranslations("forms.fieldTypes");
  const settings = (schema.settings ?? {}) as FormSettings;

  const sortedFields = [...schema.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const widthLabelByValue: Record<NonNullable<FormSettings["max_width"]>, string> = {
    mobile: t("ready.settingsWidthMobile"),
    tablet: t("ready.settingsWidthTablet"),
    desktop: t("ready.settingsWidthDesktop"),
  };

  const settingsTags: Array<{ key: string; label: string; value?: string }> = [
    settings.columns
      ? {
          key: "columns",
          label: t("ready.settingsColumns"),
          value: t("ready.settingsColumnsValue", { count: settings.columns }),
        }
      : null,
    settings.max_width
      ? {
          key: "max_width",
          label: t("ready.settingsMaxWidth"),
          value: widthLabelByValue[settings.max_width],
        }
      : null,
    typeof settings.min_height === "number" && settings.min_height > 0
      ? {
          key: "min_height",
          label: t("ready.settingsMinHeight"),
          value: t("ready.settingsMinHeightValue", { value: settings.min_height }),
        }
      : null,
    settings.allow_multiple_submissions
      ? {
          key: "allow_multiple_submissions",
          label: t("ready.settingsAllowMultiple"),
        }
      : null,
    settings.require_login
      ? {
          key: "require_login",
          label: t("ready.settingsRequireLogin"),
        }
      : null,
    settings.collect_ip
      ? {
          key: "collect_ip",
          label: t("ready.settingsCollectIp"),
        }
      : null,
    settings.redirect_url
      ? {
          key: "redirect_url",
          label: t("ready.settingsRedirect"),
          value: t("ready.settingsConfigured"),
        }
      : null,
    settings.submit_message
      ? {
          key: "submit_message",
          label: t("ready.settingsSubmitMessage"),
          value: settings.submit_message.trim(),
        }
      : null,
    settings.header_image_url
      ? {
          key: "header_image_url",
          label: t("ready.settingsHeaderImage"),
          value: t("ready.settingsConfigured"),
        }
      : null,
  ].filter((tag): tag is { key: string; label: string; value?: string } => tag !== null);

  const pageBg = normalizeHexColor(settings.page_background_color);
  const formBg = normalizeHexColor(settings.form_background_color);
  const hasSettingsSnapshot = settingsTags.length > 0 || Boolean(pageBg) || Boolean(formBg);

  return (
    <div className="mt-4 rounded-xl border border-[var(--border)]/60 bg-[var(--background)]/40">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)]/50">
        <div className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          {t("ready.recapHeading")}
        </div>
        <div className="text-[11.5px] text-[var(--muted)]">
          {t("ready.fieldsCount", { count: schema.fields.length })}
        </div>
      </div>
      {hasSettingsSnapshot && (
        <div className="px-4 py-3 border-b border-[var(--border)]/40 space-y-2.5">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            {t("ready.settingsSnapshot")}
          </div>
          {settingsTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {settingsTags.map((tag) => (
                <span
                  key={tag.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)]/70 bg-[var(--surface)]/55 px-2.5 py-1 text-[11px] text-[var(--foreground)]/90"
                >
                  <span className="text-[var(--muted)]">{tag.label}</span>
                  {tag.value ? (
                    <>
                      <span className="text-[var(--muted)]/45">·</span>
                      <span className="max-w-[220px] truncate font-medium" title={tag.value}>
                        {tag.value}
                      </span>
                    </>
                  ) : null}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <ColorTag label={t("ready.settingsPageColor")} value={pageBg} fallback={t("ready.settingsDefault")} />
            <ColorTag label={t("ready.settingsFormColor")} value={formBg} fallback={t("ready.settingsDefault")} />
          </div>
        </div>
      )}
      <ol className="divide-y divide-[var(--border)]/40">
        {sortedFields.map((field, index) => {
          const f = field as FormField;
          const required = f.required === true;
          const rawOptions = Array.isArray(f.options) ? f.options : [];
          const options = rawOptions
            .map((opt) => {
              if (!opt) return "";
              if (typeof opt === "string") return opt;
              if (typeof opt.label === "string" && opt.label.trim().length > 0) {
                return opt.label;
              }
              if (typeof opt.value === "string") return opt.value;
              return "";
            })
            .filter((opt) => opt.trim().length > 0);
          const showOptions = ["select", "radio", "checkbox"].includes(f.type);
          const visibleOptions = options.slice(0, 6);
          const hiddenCount = options.length - visibleOptions.length;
          const validationMax = f.validation?.max;
          const validationMin = f.validation?.min;

          return (
            <li key={f.id ?? index} className="px-4 py-3 flex items-start gap-3">
              <div className="flex items-center justify-center shrink-0 h-6 w-6 rounded-full bg-[var(--surface)]/60 border border-[var(--border)]/60 text-[10.5px] font-medium text-[var(--muted)]">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13.5px] font-medium text-[var(--foreground)] truncate">
                    {f.label || `Field ${index + 1}`}
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
                      required
                        ? "bg-[var(--primary)]/12 text-[var(--primary)]"
                        : "bg-[var(--surface)]/70 text-[var(--muted)]"
                    }`}
                  >
                    <span
                      className={`h-1 w-1 rounded-full ${
                        required ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
                      }`}
                    />
                    {required ? t("ready.required") : t("ready.optional")}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1">
                    <FieldTypeIcon type={f.type} />
                    {tft(f.type)}
                  </span>
                  {f.type === "rating" && typeof validationMax === "number" && (
                    <>
                      <span className="text-[var(--muted)]/40">·</span>
                      <span>{t("ready.ratingSummary", { max: validationMax })}</span>
                    </>
                  )}
                  {f.type === "scale" && typeof validationMax === "number" && (
                    <>
                      <span className="text-[var(--muted)]/40">·</span>
                      <span>
                        {t("ready.scaleSummary", {
                          min: typeof validationMin === "number" ? validationMin : 1,
                          max: validationMax,
                        })}
                      </span>
                    </>
                  )}
                  {showOptions && options.length > 0 && (
                    <>
                      <span className="text-[var(--muted)]/40">·</span>
                      <span>{t("ready.optionsSummary", { count: options.length })}</span>
                    </>
                  )}
                </div>
                {f.help_text && (
                  <div className="mt-1 text-[12px] text-[var(--muted)]/85 leading-relaxed">
                    {f.help_text}
                  </div>
                )}
                {showOptions && visibleOptions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {visibleOptions.map((opt, optIndex) => (
                      <span
                        key={`${f.id ?? index}-opt-${optIndex}`}
                        className="inline-flex items-center rounded-full border border-[var(--border)]/60 bg-[var(--surface)]/50 px-2 py-0.5 text-[11.5px] text-[var(--foreground)]/90"
                      >
                        {opt}
                      </span>
                    ))}
                    {hiddenCount > 0 && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] text-[var(--muted)]">
                        {t("ready.morePlaceholder", { count: hiddenCount })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function normalizeHexColor(value: string | undefined): string | null {
  if (!value) return null;
  const candidate = value.trim();
  const isHex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(candidate);
  return isHex ? candidate.toUpperCase() : null;
}

function ColorTag({
  label,
  value,
  fallback,
}: {
  label: string;
  value: string | null;
  fallback: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)]/70 bg-[var(--surface)]/55 px-2.5 py-1 text-[11px] text-[var(--foreground)]/90">
      <span className="text-[var(--muted)]">{label}</span>
      <span
        className="h-2.5 w-2.5 rounded-full border border-[var(--border)]/70"
        style={value ? { backgroundColor: value } : undefined}
      />
      <span className="font-medium">{value ?? fallback}</span>
    </span>
  );
}
