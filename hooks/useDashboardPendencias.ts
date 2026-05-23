import useSWR from "swr";
import axiosInstance from "utils/api";
import type { DashboardPendenciasResponse } from "tipos";

const fetcher = async (url: string): Promise<DashboardPendenciasResponse> => {
  const response = await axiosInstance.get<DashboardPendenciasResponse>(url);
  return response.data;
};

export function useDashboardPendencias(periodo: string) {
  const url = `/dashboard/pendencias/?periodo=${periodo}`;
  const { data, error, isLoading, mutate } =
    useSWR<DashboardPendenciasResponse>(url, fetcher, {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 60000,
      refreshInterval: 180000,
    });

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
