import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api";
import {
  defaultFormListStats,
  type Form,
  type FormBuildMode,
  type FormPlanReadyResponse,
  type FormPlanResponse,
  type ListFormsParams,
  type ListFormsResponse,
  type ListPlanSessionsParams,
  type UpdatePlanSessionPayload,
} from "../types";

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface FormsState {
  forms: Form[];
  currentForm: Form | null;
  loading: boolean;
  loadingMore: boolean;
  generating: boolean;
  nextCursor: number | null;
  hasMore: boolean;
  totalCount: number;
  /** Workspace insight from last GET /forms (UTC month). */
  responsesThisMonth: number | null;
  /** Best completion % across all owned forms with analytics; null if none. */
  bestWorkspaceCompletionRate: number | null;
  /** Snapshot of the last unfiltered "recent" list — keeps workspace insights stable while searching/filtering. */
  insightForms: Form[];
  insightTotalCount: number;
  activeQueryKey: string | null;
  selectedBuildMode: FormBuildMode;
  planningSessionId: string | null;
  planStatus: "idle" | "needs_questions" | "ready";
  autosaveStatus: AutosaveStatus;
  versionCursor: number;
  versionCount: number;
  error: string | null;
}

const initialState: FormsState = {
  forms: [],
  currentForm: null,
  loading: false,
  loadingMore: false,
  generating: false,
  nextCursor: null,
  hasMore: false,
  totalCount: 0,
  responsesThisMonth: null,
  bestWorkspaceCompletionRate: null,
  insightForms: [],
  insightTotalCount: 0,
  activeQueryKey: null,
  selectedBuildMode: "planning",
  planningSessionId: null,
  planStatus: "idle",
  autosaveStatus: "idle",
  versionCursor: 0,
  versionCount: 0,
  error: null,
};

function getVersionMeta(form: Form | null): { versionCursor: number; versionCount: number } {
  if (!form) return { versionCursor: 0, versionCount: 0 };
  const versions = Array.isArray(form.versions) ? form.versions : [];
  const count = versions.length;
  const cursorRaw = typeof form.version_cursor === "number" ? form.version_cursor : 0;
  const cursor = count > 0 ? Math.max(0, Math.min(cursorRaw, count - 1)) : 0;
  return { versionCursor: cursor, versionCount: count };
}

/** PATCH/publish responses often omit list stats; keep prior row metrics when updating the list. */
function withPreservedListStats(prev: Form | undefined, next: Form): Form {
  return {
    ...next,
    listStats: next.listStats ?? prev?.listStats,
  };
}

function syncListRow(state: FormsState, next: Form): void {
  const idx = state.forms.findIndex((f) => f.id === next.id);
  if (idx >= 0) state.forms[idx] = withPreservedListStats(state.forms[idx], next);
  const insightIdx = state.insightForms.findIndex((f) => f.id === next.id);
  if (insightIdx >= 0) {
    state.insightForms[insightIdx] = withPreservedListStats(state.insightForms[insightIdx], next);
  }
}

/** The insight snapshot only tracks the default view, so filters never rewrite workspace-level numbers. */
function isUnfilteredRecentFetch(arg: FetchFormsArgs | undefined): boolean {
  if (!arg) return true;
  return !arg.query && (arg.status ?? "all") === "all" && (arg.sort ?? "recent") === "recent";
}

type FetchFormsArgs = ListFormsParams & {
  append?: boolean;
  queryKey?: string;
};

type FetchFormsPayload = ListFormsResponse & {
  append: boolean;
  queryKey: string;
};

export const fetchForms = createAsyncThunk<FetchFormsPayload, FetchFormsArgs | undefined>(
  "forms/fetchForms",
  async (params, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      const response = await api.listForms(token, params);
      return {
        ...response,
        append: Boolean(params?.append),
        queryKey: params?.queryKey ?? "",
      };
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to load forms");
    }
  },
);

export const fetchForm = createAsyncThunk(
  "forms/fetchForm",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      return await api.getForm(token, id);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to load form");
    }
  },
);

export const createForm = createAsyncThunk(
  "forms/createForm",
  async (
    data: {
      title: string;
      description?: string;
      schema: Record<string, unknown>;
      settings?: Record<string, unknown>;
      planSessionId?: string;
    },
    { getState, rejectWithValue },
  ) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      return await api.createForm(token, data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to create form");
    }
  },
);

export const updateForm = createAsyncThunk(
  "forms/updateForm",
  async (
    {
      id,
      ...data
    }: {
      id: string;
      title?: string;
      description?: string;
      schema?: Record<string, unknown>;
      settings?: Record<string, unknown>;
      planSessionId?: string;
    },
    { getState, rejectWithValue },
  ) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      return await api.updateForm(token, id, data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to update form");
    }
  },
);

export const deleteForm = createAsyncThunk(
  "forms/deleteForm",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      await api.deleteForm(token, id);
      return id;
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to delete form");
    }
  },
);

export const publishForm = createAsyncThunk(
  "forms/publishForm",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      return await api.publishForm(token, id);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to publish form");
    }
  },
);

export const unpublishForm = createAsyncThunk(
  "forms/unpublishForm",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      return await api.unpublishForm(token, id);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to unpublish form");
    }
  },
);

export const stepFormVersionBack = createAsyncThunk(
  "forms/stepFormVersionBack",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      return await api.stepFormVersionBack(token, id);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to move to previous version");
    }
  },
);

export const stepFormVersionForward = createAsyncThunk(
  "forms/stepFormVersionForward",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      return await api.stepFormVersionForward(token, id);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to move to next version");
    }
  },
);

export const generateFormSchema = createAsyncThunk(
  "forms/generateFormSchema",
  async (prompt: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      return await api.generateFormSchema(token, prompt);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to generate form");
    }
  },
);

export const startFormPlan = createAsyncThunk(
  "forms/startFormPlan",
  async (prompt: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      return await api.startFormPlan(token, prompt);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to start planning");
    }
  },
);

export const submitFormPlanAnswers = createAsyncThunk(
  "forms/submitFormPlanAnswers",
  async (
    {
      sessionId,
      answers,
    }: { sessionId: string; answers: Record<string, string> },
    { getState, rejectWithValue },
  ) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      return await api.submitFormPlanAnswers(token, sessionId, answers);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to continue planning");
    }
  },
);

export const refineFormPlan = createAsyncThunk(
  "forms/refineFormPlan",
  async (
    {
      sessionId,
      refinement,
    }: { sessionId: string; refinement: string },
    { getState, rejectWithValue },
  ) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      return await api.refineFormPlan(token, sessionId, refinement);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to refine the form plan");
    }
  },
);

export const listPlanSessions = createAsyncThunk(
  "forms/listPlanSessions",
  async (params: ListPlanSessionsParams | undefined, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth.token!;
      return await api.listPlanSessions(token, params);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to load sessions");
    }
  },
);

export const getPlanSession = createAsyncThunk(
  "forms/getPlanSession",
  async (sessionId: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth.token!;
      return await api.getPlanSession(token, sessionId);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to load session");
    }
  },
);

export const updatePlanSession = createAsyncThunk(
  "forms/updatePlanSession",
  async (
    {
      sessionId,
      data,
    }: { sessionId: string; data: UpdatePlanSessionPayload },
    { getState, rejectWithValue },
  ) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth.token!;
      return await api.updatePlanSession(token, sessionId, data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to save chat");
    }
  },
);

const formsSlice = createSlice({
  name: "forms",
  initialState,
  reducers: {
    clearCurrentForm(state) {
      state.currentForm = null;
      state.versionCursor = 0;
      state.versionCount = 0;
    },
    clearFormsError(state) {
      state.error = null;
    },
    setCurrentForm(state, action: { payload: Form }) {
      state.currentForm = action.payload;
      const meta = getVersionMeta(action.payload);
      state.versionCursor = meta.versionCursor;
      state.versionCount = meta.versionCount;
    },
    setAutosaveStatus(state, action: { payload: AutosaveStatus }) {
      state.autosaveStatus = action.payload;
    },
    setSelectedBuildMode(state, action: { payload: FormBuildMode }) {
      state.selectedBuildMode = action.payload;
    },
    resetPlanningState(state) {
      state.planStatus = "idle";
      state.planningSessionId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchForms.pending, (state, action) => {
        const append = Boolean(action.meta.arg?.append);
        const queryKey = action.meta.arg?.queryKey ?? "";
        if (!append) {
          state.activeQueryKey = queryKey;
          state.nextCursor = null;
          state.hasMore = false;
          state.totalCount = 0;
        }
        state.loading = !append;
        state.loadingMore = append;
        state.error = null;
      })
      .addCase(fetchForms.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        if (action.payload.queryKey !== state.activeQueryKey) {
          return;
        }
        const unfiltered = isUnfilteredRecentFetch(action.meta.arg);
        if (action.payload.append) {
          const existingIds = new Set(state.forms.map((f) => f.id));
          const incoming = action.payload.items.filter((f) => !existingIds.has(f.id));
          state.forms = [...state.forms, ...incoming];
          if (unfiltered) {
            const insightIds = new Set(state.insightForms.map((f) => f.id));
            state.insightForms = [
              ...state.insightForms,
              ...action.payload.items.filter((f) => !insightIds.has(f.id)),
            ];
          }
        } else {
          state.forms = action.payload.items;
          if (unfiltered) state.insightForms = action.payload.items;
        }
        if (unfiltered) state.insightTotalCount = action.payload.totalCount;
        state.nextCursor = action.payload.nextCursor;
        state.hasMore = action.payload.hasMore;
        state.totalCount = action.payload.totalCount;
        state.responsesThisMonth = action.payload.responsesThisMonth;
        state.bestWorkspaceCompletionRate = action.payload.bestCompletionRate;
      })
      .addCase(fetchForms.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload as string;
      })
      .addCase(fetchForm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForm.fulfilled, (state, action) => {
        state.loading = false;
        state.currentForm = action.payload;
        const meta = getVersionMeta(action.payload);
        state.versionCursor = meta.versionCursor;
        state.versionCount = meta.versionCount;
      })
      .addCase(fetchForm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createForm.fulfilled, (state, action) => {
        const form = action.payload;
        const normalized = {
          ...form,
          listStats: form.listStats ?? defaultFormListStats(),
        };
        state.forms.unshift(normalized);
        state.insightForms.unshift(normalized);
        state.totalCount += 1;
        state.insightTotalCount += 1;
        state.currentForm = action.payload;
        const meta = getVersionMeta(action.payload);
        state.versionCursor = meta.versionCursor;
        state.versionCount = meta.versionCount;
      })
      .addCase(updateForm.pending, (state) => {
        state.autosaveStatus = "saving";
      })
      .addCase(updateForm.fulfilled, (state, action) => {
        state.currentForm = action.payload;
        syncListRow(state, action.payload);
        state.autosaveStatus = "saved";
        const meta = getVersionMeta(action.payload);
        state.versionCursor = meta.versionCursor;
        state.versionCount = meta.versionCount;
      })
      .addCase(updateForm.rejected, (state, action) => {
        state.autosaveStatus = "error";
        state.error = action.payload as string;
      })
      .addCase(deleteForm.fulfilled, (state, action) => {
        const prevLength = state.forms.length;
        state.forms = state.forms.filter((f) => f.id !== action.payload);
        if (state.forms.length < prevLength) {
          state.totalCount = Math.max(0, state.totalCount - 1);
        }
        const prevInsightLength = state.insightForms.length;
        state.insightForms = state.insightForms.filter((f) => f.id !== action.payload);
        if (state.insightForms.length < prevInsightLength) {
          state.insightTotalCount = Math.max(0, state.insightTotalCount - 1);
        }
        if (state.currentForm?.id === action.payload) {
          state.currentForm = null;
        }
      })
      .addCase(publishForm.fulfilled, (state, action) => {
        state.currentForm = action.payload;
        syncListRow(state, action.payload);
        const meta = getVersionMeta(action.payload);
        state.versionCursor = meta.versionCursor;
        state.versionCount = meta.versionCount;
      })
      .addCase(unpublishForm.fulfilled, (state, action) => {
        state.currentForm = action.payload;
        syncListRow(state, action.payload);
        const meta = getVersionMeta(action.payload);
        state.versionCursor = meta.versionCursor;
        state.versionCount = meta.versionCount;
      })
      .addCase(stepFormVersionBack.fulfilled, (state, action) => {
        state.currentForm = action.payload;
        syncListRow(state, action.payload);
        const meta = getVersionMeta(action.payload);
        state.versionCursor = meta.versionCursor;
        state.versionCount = meta.versionCount;
      })
      .addCase(stepFormVersionForward.fulfilled, (state, action) => {
        state.currentForm = action.payload;
        syncListRow(state, action.payload);
        const meta = getVersionMeta(action.payload);
        state.versionCursor = meta.versionCursor;
        state.versionCount = meta.versionCount;
      })
      .addCase(generateFormSchema.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(
        generateFormSchema.fulfilled,
        (state, action: { payload: FormPlanReadyResponse }) => {
          state.generating = false;
          state.planningSessionId = action.payload.sessionId;
          state.planStatus = "ready";
        },
      )
      .addCase(generateFormSchema.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload as string;
      })
      .addCase(startFormPlan.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(startFormPlan.fulfilled, (state, action: { payload: FormPlanResponse }) => {
        state.generating = false;
        state.planningSessionId = action.payload.sessionId;
        state.planStatus =
          action.payload.status === "questions_needed" ? "needs_questions" : "ready";
      })
      .addCase(startFormPlan.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload as string;
      })
      .addCase(submitFormPlanAnswers.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(
        submitFormPlanAnswers.fulfilled,
        (state, action: { payload: FormPlanResponse }) => {
          state.generating = false;
          state.planningSessionId = action.payload.sessionId;
          state.planStatus =
            action.payload.status === "questions_needed" ? "needs_questions" : "ready";
        },
      )
      .addCase(submitFormPlanAnswers.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload as string;
      })
      .addCase(refineFormPlan.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(
        refineFormPlan.fulfilled,
        (state, action: { payload: FormPlanResponse }) => {
          state.generating = false;
          state.planningSessionId = action.payload.sessionId;
          state.planStatus =
            action.payload.status === "questions_needed" ? "needs_questions" : "ready";
        },
      )
      .addCase(refineFormPlan.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCurrentForm,
  clearFormsError,
  setCurrentForm,
  setAutosaveStatus,
  setSelectedBuildMode,
  resetPlanningState,
} = formsSlice.actions;
export default formsSlice.reducer;
