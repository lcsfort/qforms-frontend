import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api";
import type { Form, GeneratedFormSchema } from "../types";

interface FormsState {
  forms: Form[];
  currentForm: Form | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
}

const initialState: FormsState = {
  forms: [],
  currentForm: null,
  loading: false,
  generating: false,
  error: null,
};

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

const formsSlice = createSlice({
  name: "forms",
  initialState,
  reducers: {
    clearCurrentForm(state) {
      state.currentForm = null;
    },
    clearFormsError(state) {
      state.error = null;
    },
    setCurrentForm(state, action: { payload: Form }) {
      state.currentForm = action.payload;
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
      })
      .addCase(fetchForm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createForm.fulfilled, (state, action) => {
        state.forms.unshift(action.payload);
        state.currentForm = action.payload;
      })
      .addCase(updateForm.fulfilled, (state, action) => {
        state.currentForm = action.payload;
        const idx = state.forms.findIndex((f) => f.id === action.payload.id);
        if (idx >= 0) state.forms[idx] = action.payload;
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
      })
      .addCase(unpublishForm.fulfilled, (state, action) => {
        state.currentForm = action.payload;
        const idx = state.forms.findIndex((f) => f.id === action.payload.id);
        if (idx >= 0) state.forms[idx] = action.payload;
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
      });
  },
});

export const { clearCurrentForm, clearFormsError, setCurrentForm } =
  formsSlice.actions;
export default formsSlice.reducer;
