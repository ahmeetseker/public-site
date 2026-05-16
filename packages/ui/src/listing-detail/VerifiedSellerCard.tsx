/**
 * VerifiedSellerCard — F37 Faz 2 / Bölüm L (iletişim).
 *
 * Mockup'taki "Doğrulanmış satıcı" kartı:
 *   - Avatar (initials) + isim + "Doğrulanmış satıcı" badge
 *   - 4 doğrulama satırı: e-Devlet TC ✓ · Telefon ✓ · EİDS yetki ✓ ·
 *     Şikayetvar 0
 *   - Üyelik tarihi + portföy sayısı (mock — `useGetPublicProfile`'den
 *     `memberSince` ve `activeListings`)
 *   - 3 CTA: Mesaj · Ara · Profili gör (`/profil/[username]`)
 *
 * Data:
 *   - `useGetPublicProfile(sellerUsername)` → F33'ten
 *
 * Mockup ref: remixed-1848500f.html L2330-2344 (seller-card section).
 *
 * Props: `{ sellerId, sellerUsername }` — sellerId Telefon/Mesaj CTA için
 * (mock telefon endpoint), sellerUsername PublicProfile lookup'a verilir.
 *
 * NOT: Top barrel'a EKLENMEZ (Astro SSR güvenliği).
 */

import { MessageCircle, Phone, ShieldCheck, User } from '@landx/icons'
import { type ReactElement } from 'react'
import { useGetPublicProfile, type PublicProfile } from '@landx/data'
import { cn } from '../lib/cn'

export interface VerifiedSellerCardProps {
  /** Mock — telefon/mesaj endpoint için (gerçek backend yok). */
  sellerId: string
  /** Public profile lookup ve `/profil/[username]` link için. */
  sellerUsername: string
}

interface VerificationItem {
  label: string
  value: string
  ok: boolean
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function buildVerifications(profile: PublicProfile | null): VerificationItem[] {
  // F33 PublicProfile şeması "verified" boolean taşıyor — detaylı 4 alan yok.
  // Mockup paritesi için deterministik mock (verified=true ise hepsi ok).
  const ok = profile?.verified ?? false
  return [
    { label: 'e-Devlet TC', value: ok ? 'Doğrulandı' : 'Bekliyor', ok },
    { label: 'Telefon', value: ok ? 'Doğrulandı' : 'Bekliyor', ok },
    { label: 'EİDS yetki belgesi', value: ok ? 'Geçerli' : 'Yok', ok },
    { label: 'Şikayetvar', value: '0 şikayet', ok: true },
  ]
}

function VerificationRow({ item }: { item: VerificationItem }): ReactElement {
  return (
    <li className="flex items-center justify-between gap-2 border-b border-border/40 py-2 text-[12px] last:border-b-0">
      <span className="text-muted-foreground">{item.label}</span>
      <span
        className={cn(
          'inline-flex items-center gap-1 font-medium',
          item.ok
            ? 'text-emerald-700 dark:text-emerald-300'
            : 'text-muted-foreground',
        )}
      >
        {item.ok ? (
          <svg
            className="h-3 w-3"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 6.5l2.5 2.5 5.5-5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
        {item.value}
      </span>
    </li>
  )
}

function membershipYears(memberSinceIso: string): number {
  const start = new Date(memberSinceIso).getTime()
  if (Number.isNaN(start)) return 0
  const diff = Date.now() - start
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 365)))
}

function CardSkeleton(): ReactElement {
  return (
    <section
      className="rounded-2xl bg-card p-4 ring-1 ring-border md:p-6"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-full bg-foreground/10" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-32 animate-pulse rounded bg-foreground/10" />
          <div className="h-3 w-48 animate-pulse rounded bg-foreground/5" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-border/40 py-2"
          >
            <span className="h-3 w-24 animate-pulse rounded bg-foreground/5" />
            <span className="h-3 w-20 animate-pulse rounded bg-foreground/5" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 animate-pulse rounded-lg bg-foreground/5" />
        ))}
      </div>
    </section>
  )
}

function MissingState({ username }: { username: string }): ReactElement {
  return (
    <section className="rounded-2xl bg-card p-6 ring-1 ring-border">
      <div className="text-sm text-muted-foreground">
        Satıcı profili bulunamadı (<span className="font-mono">{username}</span>).
      </div>
    </section>
  )
}

export function VerifiedSellerCard({
  sellerId,
  sellerUsername,
}: VerifiedSellerCardProps): ReactElement {
  const profileQ = useGetPublicProfile(sellerUsername)

  if (profileQ.isLoading) return <CardSkeleton />
  if (!profileQ.data) return <MissingState username={sellerUsername} />

  const profile = profileQ.data
  const initials = getInitials(profile.displayName)
  const verifications = buildVerifications(profile)
  const yearsActive = membershipYears(profile.memberSince)

  // Mock telefon — gerçek backend yok (sellerId per agent içerikli).
  const mockPhone = `+90 850 532 09 00`
  const profileHref = `/profil/${profile.username}`

  return (
    <section
      className="rounded-2xl bg-card p-4 ring-1 ring-border md:p-6"
      aria-labelledby={`seller-${sellerId}`}
    >
      {/* Avatar + isim + Doğrulanmış badge */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
            'bg-emerald-500/10 text-base font-semibold',
            'text-emerald-700 dark:text-emerald-300',
          )}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id={`seller-${sellerId}`}
              className="text-base font-semibold text-foreground"
            >
              {profile.displayName}
            </h3>
            {profile.verified ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full',
                  'bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium',
                  'text-emerald-700 dark:text-emerald-300',
                )}
              >
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Doğrulanmış satıcı
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {yearsActive > 0 ? (
              <>
                <span className="tabular-nums">{yearsActive}</span> yıl üyelik
                {' · '}
              </>
            ) : null}
            <span className="tabular-nums">{profile.activeListings}</span>{' '}
            aktif portföy
            {profile.rating > 0 ? (
              <>
                {' · '}
                <span aria-label="puan">★</span>{' '}
                <span className="tabular-nums">
                  {profile.rating.toFixed(1)}
                </span>{' '}
                <span className="text-muted-foreground/70">
                  ({profile.reviewCount})
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* 4 doğrulama satırı */}
      <ul className="mt-4 space-y-0">
        {verifications.map((v) => (
          <VerificationRow key={v.label} item={v} />
        ))}
      </ul>

      {/* 3 CTA */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <a
          href={`/iletisim?satici=${sellerId}`}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-lg',
            'bg-foreground/5 px-3 py-2 text-[12px] font-medium text-foreground',
            'hover:bg-foreground/10 transition-colors',
          )}
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Mesaj
        </a>
        <a
          href={`tel:${mockPhone.replace(/\s+/g, '')}`}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-lg',
            'bg-foreground/5 px-3 py-2 text-[12px] font-medium text-foreground',
            'hover:bg-foreground/10 transition-colors',
          )}
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
          Ara
        </a>
        <a
          href={profileHref}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-lg',
            'bg-emerald-600 px-3 py-2 text-[12px] font-medium text-white',
            'hover:bg-emerald-700 transition-colors',
            'dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-emerald-950',
          )}
        >
          <User className="h-3.5 w-3.5" aria-hidden="true" />
          Profili gör
        </a>
      </div>
    </section>
  )
}
