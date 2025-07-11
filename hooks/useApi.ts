import { useState, useCallback } from "react";
import {
  authenticatedFetch,
  type FetchOptions,
} from "utils/authenticatedFetch";

interface UseApiOptions {
  onSuccess?: (_data: any) => void;
  onError?: (_error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface UseApiReturn {
  loading: boolean;
  error: Error | null;
  data: any;
  execute: (_url: string, _options?: FetchOptions) => Promise<any>;
  reset: () => void;
}

const useApi = (options: UseApiOptions = {}): UseApiReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);

  const execute = useCallback(
    async (url: string, fetchOptions: FetchOptions = {}): Promise<any> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(url, fetchOptions);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || errorData.message || `HTTP ${response.status}`,
          );
        }

        const responseData = await response.json();
        setData(responseData);

        if (options.onSuccess) {
          options.onSuccess(responseData);
        }

        return responseData;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Erro desconhecido");
        setError(error);

        if (options.onError) {
          options.onError(error);
        }

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
};

export default useApi;
