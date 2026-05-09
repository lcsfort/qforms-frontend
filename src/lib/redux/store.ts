import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import formsReducer from "./formsSlice";
import workspaceReducer from "./workspaceSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    forms: formsReducer,
    workspace: workspaceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
