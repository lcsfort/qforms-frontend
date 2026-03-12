"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchForm,
  updateForm,
  publishForm,
  unpublishForm,
  deleteForm,
} from "@/lib/redux/formsSlice";
import type { FormField, FieldType, FormSettings, FormFieldOption } from "@/lib/types";
import { FormRenderer } from "@/components/FormRenderer";

const FIELD_TYPES: FieldType[] = [
  "text", "textarea", "email", "number", "select", "radio", "checkbox", "date", "file", "rating",
];

export default function FormEditorPage() {
  const t = useTranslations("forms.editor");
  const tf = useTranslations("forms");
  const tft = useTranslations("forms.fieldTypes");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  const { currentForm, loading } = useAppSelector((state) => state.forms);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [settings, setSettings] = useState<FormSettings>({});
  const [activeTab, setActiveTab] = useState<"fields" | "settings" | "preview">("fields");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const sortedFields = useMemo(
    () =>
      [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [fields],
  );

  useEffect(() => {
    dispatch(fetchForm(formId));
  }, [dispatch, formId]);

  useEffect(() => {
    if (currentForm) {
      setTitle(currentForm.title);
      setDescription(currentForm.description ?? "");
      setFields(
        Array.isArray(currentForm.schema)
          ? (currentForm.schema as FormField[])
          : [],
      );
      setSettings((currentForm.settings as FormSettings) ?? {});
    }
  }, [currentForm]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await dispatch(
        updateForm({
          id: formId,
          title,
          description: description || undefined,
          schema: fields,
          settings: settings as Record<string, unknown>,
        }),
      ).unwrap();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [dispatch, formId, title, description, fields, settings]);

  const handlePublish = async () => {
    await handleSave();
    dispatch(publishForm(formId));
  };

  const handleUnpublish = () => {
    dispatch(unpublishForm(formId));
  };

  const handleDelete = async () => {
    if (!window.confirm(tf("deleteConfirm"))) return;
    await dispatch(deleteForm(formId)).unwrap();
    router.push("/dashboard");
  };

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: tft(type),
      placeholder: "",
      help_text: "",
      required: false,
      order: fields.length + 1,
      validation: {},
      options:
        type === "select" || type === "radio" || type === "checkbox"
          ? [{ label: "Option 1", value: "option_1" }]
          : undefined,
    };
    setFields([...fields, newField]);
    setEditingField(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId).map((f, i) => ({ ...f, order: i + 1 })));
    if (editingField === fieldId) setEditingField(null);
  };

  const moveField = (fieldId: string, direction: "up" | "down") => {
    const idx = fields.findIndex((f) => f.id === fieldId);
    if (idx < 0) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === fields.length - 1) return;
    const newFields = [...fields];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newFields[idx], newFields[swapIdx]] = [newFields[swapIdx], newFields[idx]];
    setFields(newFields.map((f, i) => ({ ...f, order: i + 1 })));
  };

  const addOption = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const optNum = (field.options?.length ?? 0) + 1;
    const newOption: FormFieldOption = { label: `Option ${optNum}`, value: `option_${optNum}` };
    updateField(fieldId, { options: [...(field.options ?? []), newOption] });
  };

  const updateOption = (fieldId: string, optIdx: number, updates: Partial<FormFieldOption>) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field?.options) return;
    const opts = [...field.options];
    opts[optIdx] = { ...opts[optIdx], ...updates };
    updateField(fieldId, { options: opts });
  };

  const removeOption = (fieldId: string, optIdx: number) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field?.options) return;
    updateField(fieldId, { options: field.options.filter((_, i) => i !== optIdx) });
  };

  const copyShareLink = () => {
    if (!currentForm) return;
    const url = `${window.location.origin}/f/${currentForm.slug}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (loading || !currentForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="max-w-5xl mx-auto px-6 pt-8 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("backToForms")}
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? t("saving") : saveSuccess ? t("saved") : t("save")}
            </button>
            {currentForm.status === "published" ? (
              <button
                onClick={handleUnpublish}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium transition-colors"
              >
                {t("unpublish")}
              </button>
            ) : (
              <button
                onClick={handlePublish}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >
                {t("publish")}
              </button>
            )}
          </div>
        </div>

        {/* Title + Description */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("formTitle")}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 mb-2"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("formDescription")}
            className="w-full text-sm text-[var(--muted)] bg-transparent border-none outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        {/* Share Link */}
        {currentForm.status === "published" && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.504a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.757 8.25" />
              </svg>
              <span className="font-medium">{t("shareLink")}:</span>
              <code className="text-xs bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded">
                {typeof window !== "undefined" ? `${window.location.origin}/f/${currentForm.slug}` : `/f/${currentForm.slug}`}
              </code>
            </div>
            <button
              onClick={copyShareLink}
              className="text-sm text-green-700 dark:text-green-400 font-medium hover:underline"
            >
              {linkCopied ? t("linkCopied") : t("copyLink")}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1">
          {(["fields", "settings", "preview"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-indigo-600 text-white"
                  : "text-[var(--muted)] hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {tab === "fields" ? t("fields") : tab === "settings" ? t("settings") : t("preview")}
            </button>
          ))}
        </div>

        {/* Fields Tab */}
        {activeTab === "fields" && (
          <div>
            {fields.length === 0 ? (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center">
                <p className="text-[var(--muted)] text-sm">{t("noFields")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden"
                    >
                      {/* Field header */}
                      <div
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-[var(--muted)] w-6">{idx + 1}</span>
                          <span className="font-medium text-sm">{field.label}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[var(--muted)]">
                            {tft(field.type)}
                          </span>
                          {field.required && (
                            <span className="text-xs text-red-500 font-medium">*</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveField(field.id, "up"); }}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                            title={t("moveUp")}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveField(field.id, "down"); }}
                            disabled={idx === fields.length - 1}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                            title={t("moveDown")}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                            title={t("removeField")}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Field editor */}
                      {editingField === field.id && (
                        <div className="px-4 pb-4 border-t border-[var(--border)] pt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted)] mb-1">{t("fieldLabel")}</label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted)] mb-1">{t("fieldType")}</label>
                              <select
                                value={field.type}
                                onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                {FIELD_TYPES.map((ft) => (
                                  <option key={ft} value={ft}>{tft(ft)}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted)] mb-1">{t("fieldPlaceholder")}</label>
                              <input
                                type="text"
                                value={field.placeholder ?? ""}
                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted)] mb-1">{t("fieldHelpText")}</label>
                              <input
                                type="text"
                                value={field.help_text ?? ""}
                                onChange={(e) => updateField(field.id, { help_text: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.required ?? false}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            {t("fieldRequired")}
                          </label>

                          {/* Options editor for select/radio/checkbox */}
                          {(field.type === "select" || field.type === "radio" || field.type === "checkbox") && (
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted)] mb-2">{t("fieldOptions")}</label>
                              <div className="space-y-2">
                                {field.options?.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={opt.label}
                                      onChange={(e) => updateOption(field.id, optIdx, { label: e.target.value })}
                                      placeholder={t("optionLabel")}
                                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                      type="text"
                                      value={opt.value}
                                      onChange={(e) => updateOption(field.id, optIdx, { value: e.target.value })}
                                      placeholder={t("optionValue")}
                                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                      onClick={() => removeOption(field.id, optIdx)}
                                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 text-xs transition-colors"
                                    >
                                      {t("removeOption")}
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => addOption(field.id)}
                                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                  + {t("addOption")}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Add field */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {FIELD_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => addField(type)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    + {tft(type)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("submitMessage")}</label>
              <input
                type="text"
                value={(settings.submit_message as string) ?? ""}
                onChange={(e) => setSettings({ ...settings, submit_message: e.target.value })}
                placeholder={t("submitMessageDefault")}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allow_multiple_submissions ?? false}
                onChange={(e) => setSettings({ ...settings, allow_multiple_submissions: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              {t("allowMultiple")}
            </label>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 max-w-lg mx-auto">
            {title && <h2 className="text-xl font-bold mb-1">{title}</h2>}
            {description && <p className="text-sm text-[var(--muted)] mb-6">{description}</p>}
            <FormRenderer
              fields={fields}
              settings={settings}
              onSubmit={() => {}}
              disabled
              submitLabel={t("preview")}
            />
          </div>
        )}

        {/* Danger zone */}
        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <button
            onClick={handleDelete}
            className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            {t("deleteForm")}
          </button>
        </div>
      </main>
    </div>
  );
}
