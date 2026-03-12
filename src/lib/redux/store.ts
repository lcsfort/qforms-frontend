import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import formsReducer from "./formsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    forms: formsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
