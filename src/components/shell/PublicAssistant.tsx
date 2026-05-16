import { useState } from 'react';
import { Sparkles } from '@landx/icons';
import { AssistantDrawer, useAssistantShortcut } from '@landx/ui/ai';

export default function PublicAssistant() {
  const { open, setOpen } = useAssistantShortcut();
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg transition-transform hover:scale-105 md:bottom-6 md:right-6"
        aria-label="AI Asistanı aç (Cmd/Ctrl+J)"
      >
        <Sparkles className="size-5" />
        {hovered && (
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow">
            AI Asistan · ⌘J
          </span>
        )}
      </button>
      <AssistantDrawer
        open={open}
        onClose={() => setOpen(false)}
        role="buyer"
        initialMessage="Merhaba — arsa aramada size yardımcı olabilirim. 'İstanbul Beykoz 5000 m² imarlı 2.5M altı' gibi yazın, filtre çıkartayım."
      />
    </>
  );
}
