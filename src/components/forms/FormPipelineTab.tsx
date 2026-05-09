"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { api } from "@/lib/api";
import type {
  FormPipelineConfig,
  FormResponse,
  PipelineBoardPayload,
  PipelineStage,
} from "@/lib/types";

function prefixResp(id: string) {
  return `resp:${id}`;
}
function prefixCol(id: string) {
  return `col:${id}`;
}

function parseResp(dragId: string | number): string | null {
  const s = String(dragId);
  return s.startsWith("resp:") ? s.slice(5) : null;
}
function parseCol(overId: string | number): string | null {
  const s = String(overId);
  return s.startsWith("col:") ? s.slice(4) : null;
}

function PipelineCard({
  response,
  onOpen,
}: {
  response: FormResponse;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: prefixResp(response.id),
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const preview =
    typeof response.data === "object" && response.data !== null
      ? JSON.stringify(response.data).slice(0, 120)
      : "";

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className={`w-full text-left rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-xs shadow-sm hover:border-indigo-500/40 transition-colors cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <p className="text-[10px] text-[var(--muted)] mb-1">
        {new Date(response.submittedAt).toLocaleString()}
      </p>
      <p className="line-clamp-3 text-[var(--foreground)]">{preview || "—"}</p>
    </button>
  );
}

function PipelineColumn({
  stage,
  responses,
  onCardOpen,
}: {
  stage: PipelineStage;
  responses: FormResponse[];
  onCardOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: prefixCol(stage.id),
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-[300px] rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-3 flex flex-col gap-2 min-h-[200px] ${
        isOver ? "ring-2 ring-indigo-500/40" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: stage.color ?? "#64748b" }}
        />
        <h3 className="font-semibold text-sm">{stage.name}</h3>
        <span className="text-[10px] text-[var(--muted)] ml-auto">
          {responses.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {responses.map((r) => (
          <PipelineCard
            key={r.id}
            response={r}
            onOpen={() => onCardOpen(r.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ResponseDrawer({
  formId,
  token,
  responseId,
  members,
  onClose,
  onUpdated,
}: {
  formId: string;
  token: string;
  responseId: string;
  members: PipelineBoardPayload["members"];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState<unknown[]>([]);
  const [activities, setActivities] = useState<unknown[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [assignee, setAssignee] = useState<string>("");

  const load = useCallback(async () => {
    const [d, n, a] = await Promise.all([
      api.getPipelineResponseDetail(token, formId, responseId),
      api.listPipelineNotes(token, formId, responseId),
      api.listPipelineActivities(token, formId, responseId),
    ]);
    setDetail(d);
    setNotes(n);
    setActivities(a);
    const pipe = d.pipeline as { assignedToUserId?: string | null } | undefined;
    setAssignee(pipe?.assignedToUserId ?? "");
  }, [token, formId, responseId]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const handleAssign = async () => {
    await api.assignPipelineResponse(
      token,
      formId,
      responseId,
      assignee || null,
    );
    await load();
    onUpdated();
  };

  const data = (detail?.data as Record<string, unknown>) ?? {};

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md h-full bg-[var(--card)] border-l border-[var(--border)] shadow-2xl overflow-y-auto p-6">
        <div className="flex justify-between items-start gap-2 mb-4">
          <h2 className="text-lg font-semibold">Response</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm mb-6">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="border-b border-[var(--border)] pb-2">
              <p className="text-[10px] uppercase text-[var(--muted)]">{k}</p>
              <p className="break-words">{String(v)}</p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className="text-xs text-[var(--muted)] block mb-1">
            Assignee
          </label>
          <div className="flex gap-2">
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name || m.user.email}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleAssign()}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm"
            >
              Save
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold mb-2">Notes</p>
          <div className="flex gap-2 mb-2">
            <input
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Add a note…"
              className="flex-1 rounded-lg border border-[var(--border)] px-2 py-2 text-sm"
            />
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm"
              onClick={async () => {
                if (!noteBody.trim()) return;
                await api.addPipelineNote(
                  token,
                  formId,
                  responseId,
                  noteBody.trim(),
                );
                setNoteBody("");
                await load();
              }}
            >
              Add
            </button>
          </div>
          <ul className="space-y-2 text-xs">
            {notes.map((n) => {
              const row = n as {
                id: string;
                body: string;
                user?: { name?: string | null; email?: string };
              };
              return (
                <li
                  key={row.id}
                  className="rounded-lg bg-[var(--background)] p-2 border border-[var(--border)]"
                >
                  <p>{row.body}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-1">
                    {row.user?.name || row.user?.email}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold mb-2">Activity</p>
          <ul className="space-y-1 text-[11px] text-[var(--muted)]">
            {activities.map((a) => {
              const row = a as {
                id: string;
                type: string;
                createdAt: string;
              };
              return (
                <li key={row.id}>
                  {new Date(row.createdAt).toLocaleString()} · {row.type}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function FormPipelineTab({
  formId,
  token,
}: {
  formId: string;
  token: string;
}) {
  const [pipeline, setPipeline] = useState<FormPipelineConfig | null>(null);
  const [board, setBoard] = useState<PipelineBoardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDrag, setActiveDrag] = useState<FormResponse | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, b] = await Promise.all([
      api.getFormPipeline(token, formId),
      api.getPipelineBoard(token, formId),
    ]);
    setPipeline(p as FormPipelineConfig);
    setBoard(b);
  }, [token, formId]);

  useEffect(() => {
    load()
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load pipeline"),
      )
      .finally(() => setLoading(false));
  }, [load]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const onDragStart = (event: DragStartEvent) => {
    const rid = parseResp(event.active.id);
    if (!rid || !board) return;
    for (const col of board.stages) {
      const hit = col.responses.find((r) => r.id === rid);
      if (hit) {
        setActiveDrag(hit);
        break;
      }
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveDrag(null);
    const rid = parseResp(event.active.id);
    let stageId = event.over?.id ? parseCol(event.over.id) : null;
    if (!stageId && event.over?.id) {
      const oid = String(event.over.id);
      for (const col of board?.stages ?? []) {
        if (col.responses.some((r) => `resp:${r.id}` === oid)) {
          stageId = col.id;
          break;
        }
      }
    }
    if (!rid || !stageId) return;
    try {
      await api.movePipelineResponse(token, formId, rid, stageId);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Move failed");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!pipeline?.isEnabled) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <p className="text-[var(--muted)] mb-4">
          Enable the response pipeline to organize submissions on a Kanban board.
        </p>
        <button
          type="button"
          onClick={async () => {
            setLoading(true);
            try {
              await api.patchFormPipeline(token, formId, true);
              await load();
            } finally {
              setLoading(false);
            }
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"
        >
          Enable pipeline
        </button>
      </div>
    );
  }

  if (!board?.stages?.length) {
    return (
      <p className="text-[var(--muted)] text-sm">
        No stages yet — toggle pipeline off and on to seed defaults, or add stages via the API.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.stages.map((col) => (
          <PipelineColumn
            key={col.id}
            stage={col}
            responses={col.responses}
            onCardOpen={(id) => setDrawerId(id)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDrag ? (
          <div className="rounded-xl border border-indigo-500 bg-[var(--card)] p-3 text-xs shadow-lg w-[260px] opacity-90">
            {JSON.stringify(activeDrag.data).slice(0, 120)}
          </div>
        ) : null}
      </DragOverlay>

      {drawerId && board ? (
        <ResponseDrawer
          formId={formId}
          token={token}
          responseId={drawerId}
          members={board.members}
          onClose={() => setDrawerId(null)}
          onUpdated={() => load()}
        />
      ) : null}
    </DndContext>
  );
}
