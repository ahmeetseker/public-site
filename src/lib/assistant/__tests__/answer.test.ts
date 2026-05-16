import { describe, it, expect } from 'vitest'
import { buildAnswer } from '../answer'

describe('public-site AI buildAnswer', () => {
  it('lokasyon ve tip eşleşince ilgili cevabı döner', () => {
    const result = buildAnswer('Çanakkale deniz manzaralı arsa', 'tr')
    expect(result.text).toMatch(/çanakkale/i)
    expect(result.chart).toBeDefined()
  })

  it('sadece lokasyon varsa bölge özetine düşer', () => {
    const result = buildAnswer('Bodrum', 'tr')
    expect(result.text).toMatch(/bodrum/i)
  })

  it('eşleşme yoksa generic cevap döner', () => {
    const result = buildAnswer('xyzxyz', 'tr')
    expect(result.text).toMatch(/bulun|sonuç/i)
  })

  it('EN locale için İngilizce cevap döner', () => {
    const result = buildAnswer('Bodrum villa', 'en')
    expect(result.text).toMatch(/Bodrum/)
    expect(result.text).not.toMatch(/[ğüşıöç]/)
  })
})
