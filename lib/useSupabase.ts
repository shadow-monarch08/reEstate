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
  loadingMore: boolean;
  error: string | null;
  refetch: (newParams: P) => Promise<void>;
  fetchMore: (nextParams: P) => Promise<void>;
  hasMore: boolean;
  count?: number | null; // Added count to return type
}

export const useSupabase = <T, P extends Record<string, ParamValue>>({
  fn,
  params = {} as P,
  skip = false,
  pagination = false,
}: UseSupabaseOptions<T, P>): UseSupabaseReturn<T, P> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [count, setCount] = useState<number | null>(null); // <-- count added

  const fetchData = useCallback(
    async (fetchParams: P, append = false) => {
      setLoading(!append);
      setLoadingMore(append);
      setError(null);

      try {
        const result = await fn(fetchParams);

        if (pagination) {
          const resultTyped = result as {
            data: T[] | null;
            error: any;
            count?: number | null;
          };

          const resultData = resultTyped.data ?? [];

          if (!Array.isArray(resultData)) {
            setError("Invalid data format");
            return;
          }

          if (resultData.length < 20) {
            setHasMore(false);
          }

          if (typeof resultTyped.count === "number" && !append) {
            setCount(resultTyped.count);
          }

          setData((prev) =>
            append
              ? ({
                  data: [
                    ...(Array.isArray((prev as any)?.data)
                      ? (prev as any).data
                      : []),
                    ...resultData,
                  ],
                } as T)
              : ({ data: resultData } as T)
          );
        } else {
          // Non-paginated response assumed to be T
          setData(result as T);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(message);
        Alert.alert("Error", message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [fn, pagination, count]
  );

  useEffect(() => {
    if (!skip) {
      fetchData(params);
    }
  }, []);

  const refetch = async (newParams: P) => {
    setHasMore(true);
    await fetchData(newParams);
  };

  const fetchMore = async (nextParams: P) => {
    if (!loadingMore && !loading && hasMore) {
      await fetchData(nextParams, true);
    }
  };

  return {
    data,
    setData,
    loading,
    loadingMore,
    error,
    refetch,
    fetchMore,
    hasMore,
    count, // <-- count returned
  };
};
