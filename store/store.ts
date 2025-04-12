import { configureStore } from "@reduxjs/toolkit";
import type { Terapeuta, Paciente } from "tipos";
import terapeutasReducer from "./terapeutasSlice";
import pacientesReducer from "./pacientesSlice";

export interface TerapeutasState {
  data: Terapeuta[];
  loading: boolean;
  error: string | null;
}

export interface PacientesState {
  data: Paciente[];
  loading: boolean;
  error: string | null;
}

interface RootState {
  terapeutas: TerapeutasState;
  pacientes: PacientesState;
}

export const store = configureStore({
  reducer: {
    terapeutas: terapeutasReducer,
    pacientes: pacientesReducer,
  },
});

export type { RootState };
export type AppDispatch = typeof store.dispatch;
