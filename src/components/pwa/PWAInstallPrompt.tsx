/**
 * PWAInstallPrompt — Faz 9.18 (Wave 12 / Agent-A56)
 *
 * Discreet bottom-right install card. Token-only colors (bg-card, border,
 * text-foreground, text-muted-foreground). Suppressed on iOS Safari which
 * does not support `beforeinstallprompt`. Dismissed for 7 days when the
 * user picks "Sonra"; auto-removed after `appinstalled`.
 */
import { useEffect, useState, type ReactElement } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

const DISMISS_KEY = 'arsam-pwa-install-dismissed';
const DISMISS_DAYS = 7;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // iPad on iPadOS 13+ identifies as Mac with touch support.
  const isiPadOS =
    /Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document;
  return /iPhone|iPad|iPod/.test(ua) || isiPadOS;
}

function isDismissed(): boolean {
  if (typeof localStorage === 'undefined') return false;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number.parseInt(raw, 10);
  if (Number.isNaN(ts)) return false;
  const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  return ageDays < DISMISS_DAYS;
}

export default function PWAInstallPrompt(): ReactElement | null {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isIOS()) return; // iOS Safari has no programmatic install.
    if (isDismissed()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt as EventListener);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  const handleInstall = async () => {
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      // Prompt may be invalid (already shown) — fall through to dismiss.
    }
    setVisible(false);
    setDeferred(null);
  };

  const handleLater = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable (private mode, etc.) — silent.
    }
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Uygulamayı yükle"
      className="fixed bottom-4 right-4 z-50 max-w-xs rounded-2xl border border-border bg-card text-card-foreground shadow-lg p-4"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">arsam.net'i yükle</p>
        <p className="text-xs text-muted-foreground">
          Daha hızlı erişim için uygulamayı ana ekranına ekleyebilirsin.
        </p>
        <div className="mt-2 flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleLater}
            className="px-3 py-1.5 text-xs rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            Sonra
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Yükle
          </button>
        </div>
      </div>
    </div>
  );
}
