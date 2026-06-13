"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type FormEvent,
} from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  History,
  Info,
  Mail,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchWorkspaces } from "@/lib/redux/workspaceSlice";
import { api } from "@/lib/api";
import { getUserAvatarUrl, getUserInitials } from "@/lib/userAvatar";
import type { WorkspaceInvite, WorkspaceMemberRow, WorkspaceRole } from "@/lib/types";
import { DashboardShell } from "@/components/DashboardShell";
import { RoleSelect } from "./_components/RoleSelect";
import { ActivityLog } from "./_components/ActivityLog";

const ROLE_BADGE: Record<WorkspaceRole, string> = {
  owner: "border-[var(--primary)]/25 bg-[var(--primary)]/10 text-[var(--primary)]",
  admin: "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]",
  member: "border-[var(--border)] bg-[var(--surface)]/60 text-[var(--muted)]",
};

type TabId = "members" | "invitations" | "activity";
type TabEntry = { id: TabId; icon: ComponentType<{ className?: string; strokeWidth?: number }> };

function WorkspaceSettingsInner() {
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
  const [inviting, setInviting] = useState(false);
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
  const owner = useMemo(() => members.find((m) => m.role === "owner"), [members]);
  const ownerAvatarUrl = owner ? getUserAvatarUrl(owner.user) : null;
  const canManage = meMember?.role === "owner" || meMember?.role === "admin";
  const canAssignOwner = meMember?.role === "owner";

  const roleOptions: WorkspaceRole[] = ["owner", "admin", "member"];
  const assignableRoles = roleOptions.filter((r) => canAssignOwner || r !== "owner");
  const roleLabel = (r: WorkspaceRole) => t(`role.${r}`);
  const roleDescription = (r: WorkspaceRole) => t(`roleDesc.${r}`);

  // Tabs (invitations + activity require management rights). Stored in the URL so
  // sections are linkable and survive reloads, falling back to "members".
  const tabs = useMemo<TabEntry[]>(() => {
    const entries: TabEntry[] = [{ id: "members", icon: Users }];
    if (canManage) entries.push({ id: "invitations", icon: Mail }, { id: "activity", icon: History });
    return entries;
  }, [canManage]);
  const tabParam = searchParams.get("tab");
  const resolvedTab: TabId = tabs.some((tab) => tab.id === tabParam) ? (tabParam as TabId) : "members";
  const selectTab = (id: TabId) =>
    router.replace(id === "members" ? "/dashboard/workspace" : `/dashboard/workspace?tab=${id}`);

  const handleRoleChange = async (m: WorkspaceMemberRow, nextRole: WorkspaceRole) => {
    if (!token || !workspaceId || nextRole === m.role) return;
    setSavingMemberId(m.id);
    setError(null);
    try {
      await api.updateWorkspaceMemberRole(token, workspaceId, m.userId, nextRole);
      await loadWorkspaceData(token, workspaceId);
      setFeedback(t("memberRoleUpdated"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSavingMemberId(null);
    }
  };

  const handleRemove = async (m: WorkspaceMemberRow) => {
    if (!token || !workspaceId) return;
    setSavingMemberId(m.id);
    setError(null);
    try {
      await api.removeWorkspaceMember(token, workspaceId, m.userId);
      setMembers((prev) => prev.filter((row) => row.id !== m.id));
      setFeedback(t("memberRemoved"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSavingMemberId(null);
    }
  };

  const handleInviteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !workspaceId || !email.trim() || inviting) return;
    setInviting(true);
    setError(null);
    try {
      await api.createWorkspaceInvite(token, workspaceId, email.trim(), inviteRole);
      setEmail("");
      const next = await api.listWorkspaceInvites(token, workspaceId);
      setInvites(next);
      setFeedback(t("inviteSent"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (inv: WorkspaceInvite) => {
    if (!token || !workspaceId) return;
    setError(null);
    try {
      await api.cancelWorkspaceInvite(token, workspaceId, inv.id);
      setInvites((prev) => prev.filter((x) => x.id !== inv.id));
      setFeedback(t("inviteCancelled"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    }
  };

  return (
    <DashboardShell contentContainerClassName="max-w-5xl mx-auto">
      <div className="flex flex-col gap-6">
        {/* ── Workspace header ── */}
        <header className="soft-card flex items-center gap-4 p-6 sm:p-7">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[22px] font-semibold text-[var(--primary)]">
            {ownerAvatarUrl ? (
              <Image src={ownerAvatarUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              (active?.name ?? "W").charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {t("title")}
            </p>
            <h1 className="mt-0.5 truncate font-display text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[28px]">
              {active?.name ?? t("untitled")}
            </h1>
            {!loading && (
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                {t("memberCount", { count: members.length })}
                {meMember ? ` · ${roleLabel(meMember.role)}` : ""}
              </p>
            )}
          </div>
        </header>

        {/* ── Status banners ── */}
        {feedback ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span>{feedback}</span>
          </div>
        ) : null}
        {error ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 text-[13.5px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span>{error}</span>
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--primary)]/20 border-t-[var(--primary)]" />
          </div>
        ) : (
          <div className="flex flex-col gap-8 md:flex-row md:gap-10">
            {tabs.length > 1 && (
              <nav
                aria-label={t("title")}
                className="flex shrink-0 gap-1 overflow-x-auto pb-1 md:w-48 md:flex-col md:self-start md:overflow-visible md:pb-0 md:sticky md:top-[76px]"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const tabActive = tab.id === resolvedTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => selectTab(tab.id)}
                      aria-current={tabActive ? "true" : undefined}
                      className={`flex shrink-0 items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                        tabActive
                          ? "border-[var(--border)]/80 bg-[var(--card)] font-medium text-[var(--foreground)] shadow-sm"
                          : "border-transparent text-[var(--muted)] hover:bg-[var(--surface)]/60 hover:text-[var(--foreground)]"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${tabActive ? "text-[var(--primary)]" : ""}`}
                        strokeWidth={1.8}
                      />
                      {t(`tab.${tab.id}`)}
                    </button>
                  );
                })}
              </nav>
            )}

            <div className="min-w-0 flex-1">
              {/* ── Members ── */}
              {resolvedTab === "members" && (
                <section className="soft-card p-5 sm:p-6">
                  <h2 className="text-[15px] font-semibold text-[var(--foreground)]">{t("members")}</h2>
                  <p className="mt-1 text-[13px] text-[var(--muted)]">{t("membersHint")}</p>

                  <ul className="mt-5 divide-y divide-[var(--border)]/70 rounded-2xl border border-[var(--border)]">
                    {members.map((m) => {
                      const isYou = m.userId === user?.id;
                      const avatarUrl = getUserAvatarUrl(m.user);
                      const initials = getUserInitials(m.user);
                      const roleEditable = canManage && !(m.role === "owner" && !canAssignOwner);
                      const removable = !isYou && canManage;
                      const busy = savingMemberId === m.id;
                      return (
                        <li key={m.id} className="flex items-center gap-3 px-3.5 py-3 sm:px-4">
                          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)]">
                            {avatarUrl ? (
                              <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
                            ) : (
                              <span className="text-[12px] font-semibold text-[var(--foreground)]">{initials}</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 truncate text-[14px] font-medium text-[var(--foreground)]">
                              <span className="truncate">{m.user.name || m.user.email}</span>
                              {isYou && (
                                <span className="shrink-0 text-[12px] font-normal text-[var(--muted)]">{t("you")}</span>
                              )}
                            </p>
                            <p className="truncate text-[12.5px] text-[var(--muted)]">{m.user.email}</p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            {roleEditable ? (
                              <RoleSelect
                                value={m.role}
                                options={assignableRoles}
                                onChange={(next) => handleRoleChange(m, next)}
                                label={roleLabel}
                                description={roleDescription}
                                ariaLabel={t("changeRole")}
                                busy={busy}
                              />
                            ) : (
                              <span
                                className={`inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-medium ${ROLE_BADGE[m.role]}`}
                              >
                                {roleLabel(m.role)}
                              </span>
                            )}
                            {removable && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleRemove(m)}
                                aria-label={t("removeMember")}
                                title={t("removeMember")}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-500/15 dark:hover:text-red-400 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {/* ── Invitations ── */}
              {resolvedTab === "invitations" && canManage && (
                <section className="soft-card p-5 sm:p-6">
                  <h2 className="text-[15px] font-semibold text-[var(--foreground)]">{t("invite")}</h2>
                  <p className="mt-1 text-[13px] text-[var(--muted)]">{t("inviteHint")}</p>

                  <form className="mt-5 space-y-3" onSubmit={handleInviteSubmit}>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("emailPlaceholder")}
                        className="h-9 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)]/40 px-3.5 text-sm text-[var(--foreground)] outline-none transition-all duration-150 placeholder:text-[var(--muted)]/70 focus:border-[var(--primary)]/60 focus:ring-2 focus:ring-[var(--primary)]/25"
                      />
                      <RoleSelect
                        value={inviteRole}
                        options={assignableRoles}
                        onChange={setInviteRole}
                        label={roleLabel}
                        description={roleDescription}
                        ariaLabel={t("roleLabel")}
                        align="left"
                        triggerClassName="w-full justify-between sm:w-auto"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!email.trim() || inviting}
                      className="cta-gradient inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <UserPlus className="h-4 w-4" strokeWidth={2} />
                      {t("sendInvite")}
                    </button>
                  </form>

                  {invites.length > 0 ? (
                    <ul className="mt-5 space-y-2">
                      {invites.map((inv) => (
                        <li
                          key={inv.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/40 px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-medium text-[var(--foreground)]">{inv.email}</p>
                            <p className="truncate text-[12px] text-[var(--muted)]">
                              {roleLabel(inv.role)} ·{" "}
                              {t("expires", { date: new Date(inv.expiresAt).toLocaleDateString() })}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCancelInvite(inv)}
                            aria-label={t("cancel")}
                            title={t("cancel")}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400 cursor-pointer"
                          >
                            <X className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center">
                      <p className="text-[13px] text-[var(--muted)]">{t("noInvites")}</p>
                    </div>
                  )}

                  <div className="mt-5 flex gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 px-3.5 py-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" strokeWidth={1.8} />
                    <p className="text-[12px] leading-relaxed text-[var(--muted)]">{t("acceptHelp")}</p>
                  </div>
                </section>
              )}

              {/* ── Activity log ── */}
              {resolvedTab === "activity" && canManage && token && workspaceId && (
                <ActivityLog token={token} workspaceId={workspaceId} members={members} />
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default function WorkspaceSettingsPage() {
  // useSearchParams requires a Suspense boundary during prerendering.
  return (
    <Suspense fallback={null}>
      <WorkspaceSettingsInner />
    </Suspense>
  );
}
