"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { hydrateAuth } from "./authSlice";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      store.dispatch(hydrateAuth());
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
