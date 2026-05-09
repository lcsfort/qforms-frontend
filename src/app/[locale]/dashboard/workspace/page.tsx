"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchWorkspaces } from "@/lib/redux/workspaceSlice";
import { api } from "@/lib/api";
import type {
  WorkspaceInvite,
  WorkspaceMemberRow,
  WorkspaceRole,
} from "@/lib/types";
import { DashboardShell } from "@/components/DashboardShell";

export default function WorkspaceSettingsPage() {
  const t = useTranslations("workspace");
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { token, hydrated, user } = useAppSelector((s) => s.auth);
  const { activeWorkspaceId, items } = useAppSelector((s) => s.workspace);

  const [members, setMembers] = useState<WorkspaceMemberRow[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");
  const [loading, setLoading] = useState(true);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = activeWorkspaceId ?? items[0]?.id;
  const inviteToken = searchParams.get("invite");

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push("/signin");
      return;
    }
    dispatch(fetchWorkspaces());
  }, [dispatch, hydrated, token, router]);

  const loadWorkspaceData = async (accessToken: string, wsId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [m, i] = await Promise.all([
        api.listWorkspaceMembers(accessToken, wsId),
        api.listWorkspaceInvites(accessToken, wsId),
      ]);
      setMembers(m);
      setInvites(i);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !workspaceId) return;
    void loadWorkspaceData(token, workspaceId);
  }, [token, workspaceId]);

  useEffect(() => {
    if (!token || !inviteToken) return;
    api
      .acceptWorkspaceInvite(token, inviteToken)
      .then(() => {
        setFeedback(t("inviteAccepted"));
        dispatch(fetchWorkspaces());
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : t("inviteAcceptFailed"));
      });
  }, [token, inviteToken, dispatch, t]);

  const active = items.find((w) => w.id === workspaceId);
  const meMember = useMemo(
    () => members.find((m) => m.userId === user?.id),
    [members, user?.id],
  );
  const canManage = meMember?.role === "owner" || meMember?.role === "admin";
  const canAssignOwner = meMember?.role === "owner";

  const roleOptions: WorkspaceRole[] = ["owner", "admin", "member"];

  return (
    <DashboardShell contentContainerClassName="max-w-5xl mx-auto">
      <main className="px-5 sm:px-8 pt-8 pb-16">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-6 sm:p-8 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
            {t("title")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {active?.name ?? t("untitled")}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-2">{active?.slug}</p>
        </div>

        {feedback ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm mb-4">
            {feedback}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm mb-4">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <section className="xl:col-span-3 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
              <h2 className="font-semibold text-lg mb-1">{t("members")}</h2>
              <p className="text-sm text-[var(--muted)] mb-5">{t("membersHint")}</p>
              <ul className="rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className="px-4 py-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--foreground)] truncate">
                        {m.user.name || m.user.email}
                      </p>
                      <p className="text-xs text-[var(--muted)] truncate">
                        {m.user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={m.role}
                        disabled={
                          !canManage ||
                          savingMemberId === m.id ||
                          (m.role === "owner" && !canAssignOwner)
                        }
                        onChange={async (e) => {
                          if (!token || !workspaceId) return;
                          const nextRole = e.target.value as WorkspaceRole;
                          setSavingMemberId(m.id);
                          setError(null);
                          try {
                            await api.updateWorkspaceMemberRole(
                              token,
                              workspaceId,
                              m.userId,
                              nextRole,
                            );
                            await loadWorkspaceData(token, workspaceId);
                            setFeedback(t("memberRoleUpdated"));
                          } catch (err: unknown) {
                            setError(
                              err instanceof Error ? err.message : t("saveFailed"),
                            );
                          } finally {
                            setSavingMemberId(null);
                          }
                        }}
                        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs"
                      >
                        {roleOptions.map((r) => (
                          <option
                            key={r}
                            value={r}
                            disabled={r === "owner" && !canAssignOwner}
                          >
                            {t(`role.${r}`)}
                          </option>
                        ))}
                      </select>
                      {m.userId !== user?.id && canManage ? (
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-700 text-xs"
                          onClick={async () => {
                            if (!token || !workspaceId) return;
                            setSavingMemberId(m.id);
                            setError(null);
                            try {
                              await api.removeWorkspaceMember(
                                token,
                                workspaceId,
                                m.userId,
                              );
                              setMembers((prev) =>
                                prev.filter((row) => row.id !== m.id),
                              );
                              setFeedback(t("memberRemoved"));
                            } catch (err: unknown) {
                              setError(
                                err instanceof Error ? err.message : t("saveFailed"),
                              );
                            } finally {
                              setSavingMemberId(null);
                            }
                          }}
                        >
                          {t("removeMember")}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="xl:col-span-2 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
              <h2 className="font-semibold text-lg mb-1">{t("invite")}</h2>
              <p className="text-sm text-[var(--muted)] mb-5">{t("inviteHint")}</p>
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!token || !workspaceId || !email.trim()) return;
                  setError(null);
                  try {
                    await api.createWorkspaceInvite(
                      token,
                      workspaceId,
                      email.trim(),
                      inviteRole,
                    );
                    setEmail("");
                    const next = await api.listWorkspaceInvites(token, workspaceId);
                    setInvites(next);
                    setFeedback(t("inviteSent"));
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : t("saveFailed"));
                  }
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="email"
                    required
                    disabled={!canManage}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="sm:col-span-2 rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm bg-[var(--background)]"
                  />
                  <select
                    value={inviteRole}
                    disabled={!canManage}
                    onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                    className="rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm bg-[var(--background)]"
                  >
                    {roleOptions
                      .filter((r) => canAssignOwner || r !== "owner")
                      .map((r) => (
                        <option key={r} value={r}>
                          {t(`role.${r}`)}
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!canManage}
                  className="w-full rounded-xl bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 disabled:opacity-50"
                >
                  {t("sendInvite")}
                </button>
              </form>

              {invites.length > 0 ? (
                <ul className="mt-5 space-y-2 text-sm">
                  {invites.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2.5 bg-[var(--background)]"
                    >
                      <div>
                        <p className="text-sm font-medium">{inv.email}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {t(`role.${inv.role}`)} ·{" "}
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      {canManage ? (
                        <button
                          type="button"
                          className="text-red-600 text-xs"
                          onClick={async () => {
                            if (!token || !workspaceId) return;
                            await api.cancelWorkspaceInvite(
                              token,
                              workspaceId,
                              inv.id,
                            );
                            setInvites((prev) => prev.filter((x) => x.id !== inv.id));
                            setFeedback(t("inviteCancelled"));
                          }}
                        >
                          {t("cancel")}
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--muted)] mt-5">{t("noInvites")}</p>
              )}

              <div className="rounded-xl border border-[var(--border)] p-3 bg-[var(--surface)]/40 mt-5">
                <p className="text-xs text-[var(--muted)]">{t("acceptHelp")}</p>
              </div>
            </section>
          </div>
        )}
      </main>
    </DashboardShell>
  );
}
