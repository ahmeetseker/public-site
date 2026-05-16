import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion'
import { useReducedMotion } from '../lib/motion'

interface GridSettings {
  gridSize: number
  strokeOpacity: number
  blur: number
  maskRadius: number
  maskCenter: number
  parallax: number
  drift: number
}

const DEFAULTS: GridSettings = {
  gridSize: 48,
  strokeOpacity: 0.25,
  blur: 0,
  maskRadius: 60,
  maskCenter: 1,
  parallax: 0.025,
  drift: 0.018,
}

const STORAGE_KEY = 'landx-grid-tweaks'

const listeners = new Set<() => void>()

function loadSettings(): GridSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

let cachedSettings: GridSettings | null = null

function getSnapshot(): GridSettings {
  if (cachedSettings === null) cachedSettings = loadSettings()
  return cachedSettings
}

function getServerSnapshot(): GridSettings {
  return DEFAULTS
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function setSettings(next: GridSettings): void {
  cachedSettings = next
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }
  for (const cb of listeners) cb()
}

function useGridSettings(): GridSettings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function AnimatedGrid() {
  const reducedMotion = useReducedMotion()
  const settings = useGridSettings()
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  const targetX = useRef(0)
  const targetY = useRef(0)
  const driftY = useRef(0)

  useEffect(() => {
    if (reducedMotion) return
    const handle = (e: PointerEvent) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      targetX.current = -(e.clientX - cx) * settings.parallax
      targetY.current = -(e.clientY - cy) * settings.parallax
    }
    window.addEventListener('pointermove', handle)
    return () => window.removeEventListener('pointermove', handle)
  }, [reducedMotion, settings.parallax])

  useAnimationFrame((_, delta) => {
    if (reducedMotion) return
    const cur = {
      x: offsetX.get(),
      y: offsetY.get(),
    }
    driftY.current -= settings.drift * delta
    const tY = targetY.current + driftY.current
    offsetX.set(cur.x + (targetX.current - cur.x) * 0.06)
    offsetY.set(cur.y + (tY - cur.y) * 0.06)
  })

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        background:
          'radial-gradient(1200px 800px at 50% 0%, hsl(var(--accent) / 0.05), transparent 60%), hsl(var(--background))',
      }}
    >
      <svg
        className="h-full w-full"
        style={settings.blur > 0 ? { filter: `blur(${settings.blur}px)` } : undefined}
      >
        <defs>
          <motion.pattern
            id="landx-grid"
            width={settings.gridSize}
            height={settings.gridSize}
            patternUnits="userSpaceOnUse"
            x={offsetX}
            y={offsetY}
          >
            <path
              d={`M ${settings.gridSize} 0 L 0 0 0 ${settings.gridSize}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              strokeOpacity={settings.strokeOpacity}
              className="text-muted-foreground"
            />
          </motion.pattern>
          <radialGradient
            id="landx-grid-mask"
            cx="50%"
            cy="50%"
            r={`${settings.maskRadius}%`}
          >
            <stop offset="0%" stopColor="white" stopOpacity={settings.maskCenter} />
            <stop offset="100%" stopColor="white" stopOpacity={0} />
          </radialGradient>
          <mask id="landx-grid-mask-fade">
            <rect width="100%" height="100%" fill="url(#landx-grid-mask)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#landx-grid)" mask="url(#landx-grid-mask-fade)" />
      </svg>
    </div>
  )
}

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, step, suffix, onChange }: SliderRowProps) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-foreground">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">
          {value}
          {suffix ?? ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-foreground"
      />
    </label>
  )
}

export function GridTweaksPanel() {
  const settings = useGridSettings()
  const [open, setOpen] = useState(false)

  function update<K extends keyof GridSettings>(key: K, value: GridSettings[K]) {
    setSettings({ ...settings, [key]: value })
  }

  function reset() {
    setSettings(DEFAULTS)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Arka plan ayarları"
        className="fixed bottom-4 right-4 z-50 inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 text-[11px] font-medium text-foreground shadow-sm backdrop-blur hover:bg-card"
      >
        <span aria-hidden>▦</span>
        <span>Grid</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-64 rounded-2xl border border-border bg-card/95 p-3 text-foreground shadow-xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Arka plan
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={reset}
            className="rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            Sıfırla
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Kapat"
            className="rounded-md px-1.5 py-0.5 text-[12px] leading-none text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            ×
          </button>
        </div>
      </div>
      <div className="space-y-2.5">
        <SliderRow
          label="Hücre boyu"
          value={settings.gridSize}
          min={16}
          max={120}
          step={2}
          suffix="px"
          onChange={(v) => update('gridSize', v)}
        />
        <SliderRow
          label="Çizgi opaklığı"
          value={Math.round(settings.strokeOpacity * 100) / 100}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => update('strokeOpacity', v)}
        />
        <SliderRow
          label="Blur"
          value={settings.blur}
          min={0}
          max={4}
          step={0.1}
          suffix="px"
          onChange={(v) => update('blur', v)}
        />
        <SliderRow
          label="Maske yarıçapı"
          value={settings.maskRadius}
          min={20}
          max={120}
          step={1}
          suffix="%"
          onChange={(v) => update('maskRadius', v)}
        />
        <SliderRow
          label="Merkez yoğunluğu"
          value={Math.round(settings.maskCenter * 100) / 100}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => update('maskCenter', v)}
        />
        <SliderRow
          label="Paralaks"
          value={Math.round(settings.parallax * 1000) / 1000}
          min={0}
          max={0.1}
          step={0.001}
          onChange={(v) => update('parallax', v)}
        />
        <SliderRow
          label="Drift"
          value={Math.round(settings.drift * 1000) / 1000}
          min={0}
          max={0.05}
          step={0.001}
          onChange={(v) => update('drift', v)}
        />
      </div>
    </div>
  )
}
