import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchForm } from "@/lib/redux/formsSlice";
import type { Form, StoredPlanSession } from "@/lib/types";

interface Args {
  resumeSession: (sessionId: string) => Promise<StoredPlanSession | null>;
  refreshFormContext: (
    form: Form,
    opts: { lastSyncedFormUpdatedAt: string | null },
  ) => void;
  bootstrapFromForm: (form: Form) => void;
}

/**
 * Handles `?sessionId=...` and `?formId=...` URL params on the new-form page:
 *  - `?sessionId`: resume the saved chat. If it has a linked form, fetch the
 *    form too and inject an external-edit snapshot when the form moved since
 *    last sync.
 *  - `?formId`: if the form has a linked planSession, redirect to
 *    `?sessionId=<that session>`. Otherwise bootstrap a brand-new chat seeded
 *    with the form's current JSON so the first user message iterates on it.
 */
export function useResumeBootstrap({
  resumeSession,
  refreshFormContext,
  bootstrapFromForm,
}: Args): void {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { token, hydrated } = useAppSelector((state) => state.auth);
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated || !token) return;
    const sessionId = searchParams.get("sessionId");
    const formId = searchParams.get("formId");
    const key = `${sessionId ?? ""}|${formId ?? ""}`;
    if (!sessionId && !formId) return;
    if (handledRef.current === key) return;
    handledRef.current = key;

    void (async () => {
      if (sessionId) {
        const session = await resumeSession(sessionId);
        if (!session) return;
        if (session.formId) {
          try {
            const form = await dispatch(fetchForm(session.formId)).unwrap();
            refreshFormContext(form as unknown as Form, {
              lastSyncedFormUpdatedAt: session.lastSyncedFormUpdatedAt,
            });
          } catch {
            // form might have been deleted — carry on with the chat only.
          }
        }
        return;
      }

      if (formId) {
        try {
          const form = (await dispatch(fetchForm(formId)).unwrap()) as Form;
          if (form?.planSession?.id) {
            router.replace(
              `/dashboard/forms/new?sessionId=${form.planSession.id}&formId=${form.id}`,
            );
            return;
          }
          bootstrapFromForm(form);
        } catch {
          // ignore — stay on the default new-form page
        }
      }
    })();
  }, [
    hydrated,
    token,
    searchParams,
    resumeSession,
    refreshFormContext,
    bootstrapFromForm,
    dispatch,
    router,
  ]);
}
