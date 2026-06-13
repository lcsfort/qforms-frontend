import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import formsReducer from "./formsSlice";
import workspaceReducer from "./workspaceSlice";
import dashboardInsightsReducer from "./dashboardInsightsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    forms: formsReducer,
    workspace: workspaceReducer,
    dashboardInsights: dashboardInsightsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
