/**
 * TkgmParcelLookup — `/ilan-ver` Step 1 (Konum) widget.
 *
 * Wave F36 / Slice F36.B — landxpanel paritesi.
 *
 * 4 input (il / ilçe / ada / parsel) + "Sorgula" CTA. Submit eder eden
 * `useQueryTkgmParcel()` mutation'ını tetikler — Faz 1 mock'u 800-3,300 ms
 * latency simüle eder, %3 ihtimalle E003_TIMEOUT döner. Sonuç paneli:
 *   - errorCode `OK`     → yeşil cam kart: yüzölçümü, cinsi, hisse oranı, status badge
 *   - errorCode `E001*`  → kırmızı kart: "Parsel kaydı bulunamadı" + tekrar dene
 *   - errorCode `E002*`  → kırmızı kart: "Ada/parsel sayı olmalı" + tekrar dene
 *   - errorCode `E003*`  → kırmızı kart: "TKGM servisi cevap vermedi" + tekrar dene
 *
 * `onParcelLookup(parcel)` callback: parent (Step1Konum) wizard draft'ına
 * il/ilçe/yüzölçümü (m²) kopyalar — Step 2 alan alanını ön doldurur.
 *
 * Self-contained: kendi QueryClient'ını üretir (WizardShell şu an provider'a
 * sahip değil — diğer island'lar da bu pattern'i kullanıyor).
 *
 * Tasarım: Liquid Glass tokens (bg-card / bg-foreground / text-muted-foreground),
 * `font-serif italic` SADECE başlık vurgusunda. Mobile-first 375px.
 */
import { useState, type FormEvent } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQueryTkgmParcel } from '@landx/data'
import type {
  TkgmParcel,
  TkgmQueryResult,
  TkgmStatus,
  TkgmCins,
  TkgmErrorCode,
} from '@landx/data'

export interface TkgmParcelLookupProps {
  /** Sonuç başarılıysa parent draft'a kopyala (il/ilçe/yüzölçümü). */
  onParcelLookup?: (parcel: TkgmParcel) => void
  /** Başlangıç değerleri — Step 1 form'undaki il/ilçe ile senkronize. */
  initialIl?: string
  initialIlce?: string
}

const STATUS_LABELS: Record<TkgmStatus, string> = {
  temiz: 'Temiz',
  ipotekli: 'İpotekli',
  serh: 'Şerhli',
  tedbir: 'Tedbirli',
  haciz: 'Hacizli',
}

const CINS_LABELS: Record<TkgmCins, string> = {
  Arsa: 'Arsa',
  Tarla: 'Tarla',
  Bağ: 'Bağ',
  Bahçe: 'Bahçe',
  Zeytinlik: 'Zeytinlik',
}

const ERROR_LABELS: Record<Exclude<TkgmErrorCode, 'OK'>, { title: string; hint: string }> = {
  E001_NOT_FOUND: {
    title: 'Parsel kaydı bulunamadı',
    hint: 'İl, ilçe, ada ve parsel bilgilerini kontrol edip tekrar dene.',
  },
  E002_INVALID_PARSEL: {
    title: 'Geçersiz ada / parsel',
    hint: 'Ada ve parsel numaraları yalnızca rakam olmalı.',
  },
  E003_TIMEOUT: {
    title: 'TKGM servisi yanıt vermedi',
    hint: 'Servis yoğunluğu olabilir, birkaç saniye sonra tekrar dene.',
  },
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})

export default function TkgmParcelLookup(props: TkgmParcelLookupProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TkgmParcelLookupInner {...props} />
    </QueryClientProvider>
  )
}

function TkgmParcelLookupInner({
  onParcelLookup,
  initialIl = '',
  initialIlce = '',
}: TkgmParcelLookupProps) {
  const [il, setIl] = useState(initialIl)
  const [ilce, setIlce] = useState(initialIlce)
  const [ada, setAda] = useState('')
  const [parsel, setParsel] = useState('')
  const mutation = useQueryTkgmParcel()
  const result: TkgmQueryResult | undefined = mutation.data

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (mutation.isPending) return
    mutation.mutate({ il: il.trim(), ilce: ilce.trim(), ada: ada.trim(), parsel: parsel.trim() })
  }

  function onCopy() {
    if (result?.errorCode === 'OK' && result.parcel) {
      onParcelLookup?.(result.parcel)
    }
  }

  const canSubmit = il.trim().length > 0 && ilce.trim().length > 0 && ada.trim().length > 0 && parsel.trim().length > 0
  const isPending = mutation.isPending

  return (
    <section
      data-tkgm-lookup=""
      className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm md:p-5"
    >
      <header className="mb-3 flex flex-col gap-1">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          TKGM · Parsel Sorgu
        </div>
        <h3 className="font-serif text-lg font-normal tracking-tight md:text-xl">
          Tapu kaydını <em className="font-serif italic font-normal">doğrula</em>
        </h3>
        <p className="text-xs text-muted-foreground md:text-sm">
          İl, ilçe, ada ve parsel ile TKGM kaydını sorgula. Sonuç onaylanırsa form'a kopyala.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <LabeledInput id="tkgm-il" label="İl" value={il} onChange={setIl} placeholder="Örn: İstanbul" />
          <LabeledInput id="tkgm-ilce" label="İlçe" value={ilce} onChange={setIlce} placeholder="Örn: Tuzla" />
          <LabeledInput
            id="tkgm-ada"
            label="Ada"
            value={ada}
            onChange={setAda}
            placeholder="Örn: 1024"
            inputMode="numeric"
          />
          <LabeledInput
            id="tkgm-parsel"
            label="Parsel"
            value={parsel}
            onChange={setParsel}
            placeholder="Örn: 7"
            inputMode="numeric"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit || isPending}
          data-tkgm-submit=""
          data-pending={isPending ? 'true' : 'false'}
          className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition md:w-auto ${
            !canSubmit || isPending
              ? 'bg-foreground/30 text-background cursor-not-allowed'
              : 'bg-foreground text-background hover:opacity-90'
          }`}
        >
          {isPending ? (
            <>
              <Spinner /> Sorgulanıyor…
            </>
          ) : (
            <>Sorgula</>
          )}
        </button>
      </form>

      {isPending && <PendingSkeleton />}

      {!isPending && mutation.isError && (
        <ResultError
          title="Bağlantı hatası"
          hint="Sorgu sırasında beklenmedik bir hata oluştu. Lütfen tekrar dene."
          onRetry={() => mutation.reset()}
        />
      )}

      {!isPending && result && result.errorCode === 'OK' && result.parcel && (
        <ResultOk parcel={result.parcel} latencyMs={result.latencyMs} onCopy={onCopy} />
      )}

      {!isPending && result && result.errorCode !== 'OK' && (
        <ResultError
          title={ERROR_LABELS[result.errorCode].title}
          hint={ERROR_LABELS[result.errorCode].hint}
          onRetry={() => mutation.reset()}
        />
      )}
    </section>
  )
}

function LabeledInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: 'numeric'
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
      />
    </div>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  )
}

function PendingSkeleton() {
  return (
    <div
      data-tkgm-skeleton=""
      className="mt-4 space-y-2 rounded-xl border border-border bg-card/40 p-3"
      aria-live="polite"
    >
      <div className="h-3 w-2/3 animate-pulse rounded-full bg-foreground/10" />
      <div className="h-3 w-1/2 animate-pulse rounded-full bg-foreground/10" />
      <div className="h-3 w-3/4 animate-pulse rounded-full bg-foreground/10" />
    </div>
  )
}

function ResultOk({
  parcel,
  latencyMs,
  onCopy,
}: {
  parcel: TkgmParcel
  latencyMs: number
  onCopy: () => void
}) {
  const hissePct = Math.round(parcel.hisseOrani * 100)
  return (
    <div
      data-tkgm-result="ok"
      className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
    >
      <header className="mb-2 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
        >
          ✓
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
          TKGM · Doğrulandı ({latencyMs} ms)
        </span>
      </header>

      <dl className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        <ResultRow label="Yüzölçümü" value={`${parcel.yuzolcumu.toLocaleString('tr-TR')} m²`} />
        <ResultRow label="Cinsi" value={CINS_LABELS[parcel.cinsi]} />
        <ResultRow label="Hisse oranı" value={`%${hissePct}`} />
        <ResultRow
          label="Durum"
          value={
            <StatusBadge status={parcel.status} />
          }
        />
        {parcel.mahalle && <ResultRow label="Mahalle" value={parcel.mahalle} />}
        {parcel.pafta && <ResultRow label="Pafta" value={parcel.pafta} />}
      </dl>

      <button
        type="button"
        onClick={onCopy}
        data-tkgm-copy=""
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-500/15 dark:text-emerald-200"
      >
        Form'a kopyala
      </button>
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1 last:border-b-0">
      <dt className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

function StatusBadge({ status }: { status: TkgmStatus }) {
  const tone =
    status === 'temiz'
      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
      : status === 'ipotekli'
        ? 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200'
        : status === 'haciz'
          ? 'border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-200'
          : 'border-foreground/20 bg-foreground/10 text-foreground'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}
      data-tkgm-status={status}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

function ResultError({
  title,
  hint,
  onRetry,
}: {
  title: string
  hint: string
  onRetry: () => void
}) {
  return (
    <div
      data-tkgm-result="error"
      role="alert"
      className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4"
    >
      <header className="mb-1 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300"
        >
          !
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
          TKGM · Hata
        </span>
      </header>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <button
        type="button"
        onClick={onRetry}
        data-tkgm-retry=""
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-800 transition hover:bg-rose-500/15 dark:text-rose-200"
      >
        Tekrar dene
      </button>
    </div>
  )
}
