// Mock API latency simülasyonu — gerçek backend gelene kadar.
// İlk render'da skeleton flash'ı göstermek için yeterli, ama UX'i bozmayacak kadar kısa.

const DEFAULT_LATENCY = 120

export function mockAsync<T>(value: T, latency = DEFAULT_LATENCY): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), latency)
  })
}
