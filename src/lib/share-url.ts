// share-url — pure helpers for building social platform "intent" URLs.
//
// KVKK note: We deliberately DO NOT load any third-party SDK (Twitter widgets,
// WhatsApp Click-to-Chat JS, Facebook SDK, etc.). Each helper returns a plain
// HTTPS URL whose navigation the user initiates with an explicit click.
// No data leaves the browser until the user navigates.
//
// Tree-shakeable, framework-agnostic, no DOM access.

export function buildXIntent(url: string, text: string): string {
  const params = new URLSearchParams()
  params.set('url', url)
  params.set('text', text)
  return `https://twitter.com/intent/tweet?${params.toString()}`
}

export function buildWhatsAppIntent(url: string, text: string): string {
  // wa.me expects a single `text` parameter that contains both the message
  // body and the URL (newline-separated reads as "title\nurl").
  const params = new URLSearchParams()
  params.set('text', `${text}\n${url}`)
  return `https://wa.me/?${params.toString()}`
}

export function buildFacebookIntent(url: string): string {
  const params = new URLSearchParams()
  params.set('u', url)
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`
}
