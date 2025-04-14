import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { Paciente, Sessao, Terapeuta } from "tipos";
import pacientesReducer from "./pacientesSlice";
import terapeutasReducer from "./terapeutasSlice";
import sessoesReducer from "./sessoesSlice";

export interface PacientesState {
  data: Paciente[];
  loading: boolean;
  error: string | null;
}

export interface TerapeutasState {
  data: Terapeuta[];
  loading: boolean;
  error: string | null;
}

export interface SessoesState {
  data: Sessao[];
  loading: boolean;
  error: string | null;
}

// Combinar reducers
const rootReducer = combineReducers({
  pacientes: pacientesReducer,
  terapeutas: terapeutasReducer,
  sessoes: sessoesReducer,
});

// Configurar store
export const store = configureStore({
  reducer: rootReducer,
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks customizados para Redux
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
