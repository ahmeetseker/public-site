/**
 * ListingDetailQueryProvider — F37 listing-detail island'larının ortak
 * TanStack Query sağlayıcısı.
 *
 * Public-site Astro SSR'da QueryClient yok; her island kendi provider'ı
 * içinde mount edilir. Modül-içi singleton sayesinde aynı sayfadaki birden
 * fazla island (E + J + K + sibling 9) cache'i paylaşır.
 *
 * Sibling agent'lar (F37.1 / F37.2 / F37.3) kendi bileşenlerini default
 * export ederken bu provider ile sarmalı.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

let _client: QueryClient | null = null

function getClient(): QueryClient {
  if (_client) return _client
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
  })
  return _client
}

export function ListingDetailQueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getClient()}>{children}</QueryClientProvider>
}
