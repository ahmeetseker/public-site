import type { APIRoute } from 'astro'

// Mock contact endpoint. The public-site uses Astro `output: 'static'`, so this
// file is pre-rendered at build time and may not respond to live POSTs. Real
// integration arrives in Faz 12.X; meanwhile the contact form on /iletisim is
// intercepted by client-side JS and never actually hits this endpoint.

export const prerender = true

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      status: 'mock',
      message: 'arsam.net iletişim formu MVP — gerçek backend Faz 12 ile gelecek.',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )

export const POST: APIRoute = () =>
  new Response(
    JSON.stringify({
      status: 'mock',
      message: 'Form alındı (mock).',
      ticketId: `TK-${Date.now()}`,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
