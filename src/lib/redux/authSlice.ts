import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api";

interface User {
  id: string;
  email: string;
  name: string | null;
  isEmailVerified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  signupSuccess: boolean;
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  loading: false,
  error: null,
  signupSuccess: false,
};

export const signup = createAsyncThunk(
  "auth/signup",
  async (
    data: { email: string; password: string; name?: string; locale?: string },
    { rejectWithValue }
  ) => {
    try {
      return await api.signup(data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Signup failed");
    }
  }
);

export const signin = createAsyncThunk(
  "auth/signin",
  async (
    data: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      return await api.signin(data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Signin failed");
    }
  }
);

export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      return await api.getProfile(state.auth.token!);
    } catch (err: unknown) {
      const error = err as { message?: string };
      return rejectWithValue(error.message ?? "Failed to fetch profile");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      state.signupSuccess = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    },
    clearError(state) {
      state.error = null;
    },
    clearSignupSuccess(state) {
      state.signupSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.signupSuccess = false;
      })
      .addCase(signup.fulfilled, (state) => {
        state.loading = false;
        state.signupSuccess = true;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(signin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken;
        state.user = action.payload.user;
        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.accessToken);
        }
      })
      .addCase(signin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.user = null;
        state.token = null;
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
      });
  },
});

export const { logout, clearError, clearSignupSuccess } = authSlice.actions;
export default authSlice.reducer;
