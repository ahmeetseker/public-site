/**
 * QueryProvider — F33 Faz 2 AI islands için ortak TanStack Query sağlayıcı.
 *
 * Public-site'da QueryClient yok; her AI island kendi provider'ında çalışır.
 * Modül-içi singleton sayesinde aynı sayfadaki birden fazla island (örn. ilan
 * sayfasında valuation + qa + tapu badge) cache'i paylaşır.
 *
 * SSR yok — tüm AI island'lar `client:only="react"` veya `client:visible`
 * ile mount edilir, queryClient sadece browser'da yaratılır.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

let _client: QueryClient | null = null;

function getClient(): QueryClient {
  if (_client) return _client;
  _client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  });
  return _client;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getClient()}>{children}</QueryClientProvider>;
}
