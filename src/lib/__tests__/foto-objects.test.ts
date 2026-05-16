// Vitest: foto-objects.ts — ObjectURL lifecycle for /ilan-ver photo upload
// (Wave F6.A).
//
// `URL.createObjectURL` / `URL.revokeObjectURL` are stubbed because jsdom does
// not implement them; we count invocations to assert that the lifecycle helpers
// actually release the in-memory blob references they hand out.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  createPhotoEntry,
  revokeAll,
  revokePhoto,
  validatePhotoFile,
} from '../foto-objects'

const created: string[] = []
const revoked: string[] = []
let urlSeq = 0

beforeEach(() => {
  created.length = 0
  revoked.length = 0
  urlSeq = 0
  // jsdom doesn't ship URL.createObjectURL — stub it deterministically.
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: (_blob: Blob) => {
      const u = `blob:mock/${++urlSeq}`
      created.push(u)
      return u
    },
    revokeObjectURL: (url: string) => {
      revoked.push(url)
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function mkFile(name: string, size: number, type = 'image/jpeg'): File {
  // jsdom File ignores actual bytes for `size`; we Object.defineProperty it.
  const f = new File([new Uint8Array(0)], name, { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

describe('foto-objects.createPhotoEntry', () => {
  it('returns a PhotoEntry with id, url, name, size', () => {
    const entry = createPhotoEntry(mkFile('a.jpg', 1024))
    expect(entry.id).toMatch(/.+/)
    expect(entry.url).toBe('blob:mock/1')
    expect(entry.name).toBe('a.jpg')
    expect(entry.size).toBe(1024)
  })

  it('produces unique ids for distinct entries', () => {
    const a = createPhotoEntry(mkFile('a.jpg', 1))
    const b = createPhotoEntry(mkFile('b.jpg', 1))
    const c = createPhotoEntry(mkFile('c.jpg', 1))
    expect(new Set([a.id, b.id, c.id]).size).toBe(3)
  })
})

describe('foto-objects.revokePhoto', () => {
  it('calls URL.revokeObjectURL with the entry url', () => {
    const e = createPhotoEntry(mkFile('a.jpg', 1))
    revokePhoto(e)
    expect(revoked).toEqual(['blob:mock/1'])
  })

  it('does nothing when the url is empty', () => {
    revokePhoto({ url: '' })
    expect(revoked).toHaveLength(0)
  })
})

describe('foto-objects.revokeAll', () => {
  it('revokes every entry url', () => {
    const a = createPhotoEntry(mkFile('a.jpg', 1))
    const b = createPhotoEntry(mkFile('b.jpg', 1))
    const c = createPhotoEntry(mkFile('c.jpg', 1))
    revokeAll([a, b, c])
    expect(revoked.sort()).toEqual(['blob:mock/1', 'blob:mock/2', 'blob:mock/3'])
  })

  it('tolerates an empty array', () => {
    revokeAll([])
    expect(revoked).toHaveLength(0)
  })
})

describe('foto-objects.validatePhotoFile', () => {
  it('accepts an image under MAX_PHOTO_BYTES', () => {
    expect(validatePhotoFile(mkFile('a.jpg', 1024))).toBeNull()
  })

  it('rejects oversize file with size code', () => {
    expect(validatePhotoFile(mkFile('a.jpg', MAX_PHOTO_BYTES + 1))).toBe('size')
  })

  it('rejects non-image file with type code', () => {
    expect(validatePhotoFile(mkFile('a.pdf', 1024, 'application/pdf'))).toBe('type')
  })

  it('exposes MAX_PHOTOS = 8 and MAX_PHOTO_BYTES = 5 MB', () => {
    expect(MAX_PHOTOS).toBe(8)
    expect(MAX_PHOTO_BYTES).toBe(5 * 1024 * 1024)
  })
})
