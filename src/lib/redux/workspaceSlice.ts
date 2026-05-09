import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import {
  api,
  getActiveWorkspaceId,
  setActiveWorkspaceIdStorage,
} from "../api";
import type { WorkspaceSummary } from "../types";
import { logout } from "./authSlice";

export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchWorkspaces",
  async (_, { getState, rejectWithValue }) => {
    const token = (getState() as { auth: { token: string | null } }).auth.token;
    if (!token) return rejectWithValue("no token");
    try {
      return await api.listWorkspaces(token);
    } catch (e: unknown) {
      const err = e as { message?: string };
      return rejectWithValue(err.message ?? "Failed to load workspaces");
    }
  },
);

interface WorkspaceState {
  items: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
}

const initialState: WorkspaceState = {
  items: [],
  activeWorkspaceId: null,
  loading: false,
  error: null,
  hydrated: false,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    hydrateWorkspace(state) {
      state.activeWorkspaceId = getActiveWorkspaceId();
      state.hydrated = true;
    },
    setActiveWorkspace(state, action: PayloadAction<string | null>) {
      state.activeWorkspaceId = action.payload;
      setActiveWorkspaceIdStorage(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        const stored = getActiveWorkspaceId();
        const pick =
          stored && action.payload.some((w) => w.id === stored)
            ? stored
            : action.payload[0]?.id ?? null;
        if (pick) {
          state.activeWorkspaceId = pick;
          setActiveWorkspaceIdStorage(pick);
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Error";
      })
      .addCase(logout, (state) => {
        state.items = [];
        state.activeWorkspaceId = null;
        setActiveWorkspaceIdStorage(null);
      });
  },
});

export const { hydrateWorkspace, setActiveWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
