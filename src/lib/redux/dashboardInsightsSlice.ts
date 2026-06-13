import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api";
import { logout } from "./authSlice";
import type {
  DashboardAttentionApiItem,
  DashboardInsightsParams,
  DashboardLatestApiItem,
} from "../types";

interface DashboardInsightsState {
  /** Top-N attention items for the rail / bell. */
  attention: DashboardAttentionApiItem[];
  /** Total flagged across the WHOLE workspace, even when only top-N is shown. */
  attentionTotalCount: number;
  /** Full flagged list, loaded lazily for the "View all" modal. */
  attentionFull: DashboardAttentionApiItem[];
  latest: DashboardLatestApiItem[];
  loading: boolean;
  fullLoading: boolean;
  error: string | null;
  /** Guards against stale responses (workspace switch / rapid threshold changes). */
  activeInsightsQueryKey: string | null;
}

const initialState: DashboardInsightsState = {
  attention: [],
  attentionTotalCount: 0,
  attentionFull: [],
  latest: [],
  loading: false,
  fullLoading: false,
  error: null,
  activeInsightsQueryKey: null,
};

type FetchArgs = { params: DashboardInsightsParams; queryKey: string };

export const fetchDashboardInsights = createAsyncThunk(
  "dashboardInsights/fetch",
  async ({ params }: FetchArgs, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth.token!;
      return await api.getDashboardInsights(token, params);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to load insights");
    }
  },
);

export const fetchDashboardInsightsFull = createAsyncThunk(
  "dashboardInsights/fetchFull",
  async (params: DashboardInsightsParams, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as { auth: { token: string | null } }).auth.token!;
      return await api.getDashboardInsights(token, { ...params, full: true });
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to load insights");
    }
  },
);

const dashboardInsightsSlice = createSlice({
  name: "dashboardInsights",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardInsights.pending, (state, action) => {
        // Switching workspace/threshold sets supersedes any in-flight request.
        state.activeInsightsQueryKey = action.meta.arg.queryKey;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardInsights.fulfilled, (state, action) => {
        // Drop responses for a key that's no longer current.
        if (action.meta.arg.queryKey !== state.activeInsightsQueryKey) return;
        state.loading = false;
        state.attention = action.payload.attention.items;
        state.attentionTotalCount = action.payload.attention.totalCount;
        state.latest = action.payload.latest;
      })
      .addCase(fetchDashboardInsights.rejected, (state, action) => {
        if (action.meta.arg.queryKey !== state.activeInsightsQueryKey) return;
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDashboardInsightsFull.pending, (state) => {
        state.fullLoading = true;
      })
      .addCase(fetchDashboardInsightsFull.fulfilled, (state, action) => {
        state.fullLoading = false;
        state.attentionFull = action.payload.attention.items;
        // Keep the rail's count authoritative with the freshest full fetch.
        state.attentionTotalCount = action.payload.attention.totalCount;
      })
      .addCase(fetchDashboardInsightsFull.rejected, (state) => {
        state.fullLoading = false;
      })
      // Never let one account's insights bleed into the next on a shared device.
      .addCase(logout, () => initialState);
  },
});

export default dashboardInsightsSlice.reducer;
