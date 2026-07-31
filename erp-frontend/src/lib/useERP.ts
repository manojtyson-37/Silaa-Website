"use client";
import useSWR from "swr";
import { api } from "./api";

export function useERP<T>(path: string, token: string) {
  return useSWR<T>(
    token ? [path, token] : null,
    ([p, tok]: [string, string]) => api.get<T>(p, tok),
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
    }
  );
}
