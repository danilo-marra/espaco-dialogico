import { configureStore } from "@reduxjs/toolkit";
import type { Terapeuta } from "tipos";
import terapeutasReducer from "./terapeutasSlice";

export interface TerapeutasState {
  data: Terapeuta[];
  loading: boolean;
  error: string | null;
}

interface RootState {
  terapeutas: TerapeutasState;
}

export const store = configureStore({
  reducer: {
    terapeutas: terapeutasReducer,
  },
});

export type { RootState };
export type AppDispatch = typeof store.dispatch;
