import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api";
import type {
  Form,
  FormBuildMode,
  FormPlanResponse,
} from "../types";

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface FormsState {
  forms: Form[];
  currentForm: Form | null;
  loading: boolean;
  generating: boolean;
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
  generating: false,
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

export const fetchForms = createAsyncThunk(
  "forms/fetchForms",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth
        .token!;
      return await api.listForms(token);
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
      schema: unknown[];
      settings?: Record<string, unknown>;
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
      schema?: unknown[];
      settings?: Record<string, unknown>;
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
      .addCase(fetchForms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForms.fulfilled, (state, action) => {
        state.loading = false;
        state.forms = action.payload;
      })
      .addCase(fetchForms.rejected, (state, action) => {
        state.loading = false;
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
        state.forms.unshift(action.payload);
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
        const idx = state.forms.findIndex((f) => f.id === action.payload.id);
        if (idx >= 0) state.forms[idx] = action.payload;
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
        state.forms = state.forms.filter((f) => f.id !== action.payload);
        if (state.currentForm?.id === action.payload) {
          state.currentForm = null;
        }
      })
      .addCase(publishForm.fulfilled, (state, action) => {
        state.currentForm = action.payload;
        const idx = state.forms.findIndex((f) => f.id === action.payload.id);
        if (idx >= 0) state.forms[idx] = action.payload;
        const meta = getVersionMeta(action.payload);
        state.versionCursor = meta.versionCursor;
        state.versionCount = meta.versionCount;
      })
      .addCase(unpublishForm.fulfilled, (state, action) => {
        state.currentForm = action.payload;
        const idx = state.forms.findIndex((f) => f.id === action.payload.id);
        if (idx >= 0) state.forms[idx] = action.payload;
        const meta = getVersionMeta(action.payload);
        state.versionCursor = meta.versionCursor;
        state.versionCount = meta.versionCount;
      })
      .addCase(stepFormVersionBack.fulfilled, (state, action) => {
        state.currentForm = action.payload;
        const idx = state.forms.findIndex((f) => f.id === action.payload.id);
        if (idx >= 0) state.forms[idx] = action.payload;
        const meta = getVersionMeta(action.payload);
        state.versionCursor = meta.versionCursor;
        state.versionCount = meta.versionCount;
      })
      .addCase(stepFormVersionForward.fulfilled, (state, action) => {
        state.currentForm = action.payload;
        const idx = state.forms.findIndex((f) => f.id === action.payload.id);
        if (idx >= 0) state.forms[idx] = action.payload;
        const meta = getVersionMeta(action.payload);
        state.versionCursor = meta.versionCursor;
        state.versionCount = meta.versionCount;
      })
      .addCase(generateFormSchema.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(generateFormSchema.fulfilled, (state) => {
        state.generating = false;
      })
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
