import { Alert } from "react-native";
import {
  useEffect,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";

type ParamValue =
  | string
  | number
  | Array<number | string | Partial<any>>
  | undefined
  | null;

interface UseSupabaseOptions<T, P extends Record<string, ParamValue>> {
  fn: (params: P) => Promise<T>;
  params?: P;
  skip?: boolean;
  pagination?: boolean;
}

interface UseSupabaseReturn<T, P> {
  data: T | null;
  setData: Dispatch<SetStateAction<T | null>>;
  loading: boolean;
  error: string | null;
  refetch: (newParams: P) => Promise<void>;
}

export const useSupabase = <T, P extends Record<string, ParamValue>>({
  fn,
  params = {} as P,
  skip = false,
  pagination = false,
}: UseSupabaseOptions<T, P>): UseSupabaseReturn<T, P> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (fetchParams: P) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fn(fetchParams);
        if (pagination && Array.isArray(data) && Array.isArray(result)) {
          setData(
            (prev) =>
              [...((prev as T[]) ?? []), ...((result as T[]) ?? [])] as T
          );
        } else {
          setData(result);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  useEffect(() => {
    if (!skip) {
      fetchData(params);
    }
  }, []);

  const refetch = async (newParams: P) => await fetchData(newParams);

  return { data, setData, loading, error, refetch };
};
