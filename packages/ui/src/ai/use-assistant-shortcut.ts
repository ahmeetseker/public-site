import { useEffect, useState } from 'react';

export function useAssistantShortcut(): {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
} {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return {
    open,
    setOpen,
    toggle: () => setOpen((v) => !v),
  };
}
