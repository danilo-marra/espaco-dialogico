import useSWR from "swr";
import type { Paciente } from "tipos";
import axiosInstance from "utils/api";

const fetcher = async (url: string): Promise<Paciente[]> => {
  const response = await axiosInstance.get<Paciente[]>(url);
  return response.data;
};

export const useFetchPacientes = () => {
  const { data, error, isLoading, mutate } = useSWR<Paciente[]>(
    "/pacientes",
    fetcher,
  );
  return {
    pacientes: data,
    isLoading,
    isError: error,
    mutate,
  };
};
