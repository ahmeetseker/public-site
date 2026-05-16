// Wave-10 / Agent-46 / Faz-13.i — Astro content collection for listing image metadata.
//
// Why a content collection?
// - Image metadata (alt text, focal point, hero flag, ordering) lives ALONGSIDE
//   the .webp assets in `src/content/images/listings/*.json`. Each listing gets
//   its own metadata file keyed by `listingId`.
// - Schema is enforced at build via zod — typos / missing alt text break the
//   build instead of silently shipping inaccessible markup.
// - When a backend CMS lands later (Faz 13.i.b+), swap `glob` for a remote
//   loader; downstream `lib/listing-images.ts` + components stay identical.
//
// Astro convention: files / directories starting with `_` are IGNORED by the
// glob loader, so `_example-*.json` files double as documentation templates
// without ever entering the runtime collection.
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const listingImages = defineCollection({
  loader: glob({ pattern: 'listings/**/*.json', base: 'src/content/images' }),
  schema: z.object({
    listingId: z.string(),
    images: z
      .array(
        z.object({
          /** Filename inside `src/assets/listings/`, e.g. `28.AY.0142-1.webp`. */
          filename: z.string(),
          /** Required alt text (KVKK + a11y) — Turkish, ≤125 chars. */
          alt: z.string().min(1).max(160),
          /** Focal point for art-direction crops (0..1). Default centre. */
          focalX: z.number().min(0).max(1).default(0.5),
          focalY: z.number().min(0).max(1).default(0.5),
          /** Hero appears first regardless of `order`. */
          isHero: z.boolean().default(false),
          /** Ascending sort key amongst non-hero images. */
          order: z.number().default(0),
          /** Intrinsic source resolution — improves Astro's responsive logic. */
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
        }),
      )
      .min(1),
  }),
})

// Wave F8 / Agent-F8A — Blog content collection.
//
// Pattern note: bodies are authored as plain Markdown (`.md`) — same loader
// shape as `listingImages`. We deliberately do NOT depend on `@astrojs/mdx`
// for the v1 of /blog: pure markdown is enough for the 5 launch posts (5 TR
// + 5 EN companions), keeps build times low, and avoids adding an integration
// during a multi-agent wave. When richer embeds are needed (interactive
// charts, custom components) we can swap to `.mdx` with the MDX integration
// without touching the schema below.
//
// Frontmatter shape mirrors spec §4. `date` is authored as `YYYY-MM-DD`
// (string in YAML) and coerced to `Date` by zod for downstream sort.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/blog' }),
  schema: z.object({
    title: z.string().min(3).max(140),
    titleEn: z.string().min(3).max(140),
    description: z.string().min(20).max(280),
    descriptionEn: z.string().min(20).max(280),
    /** Authored as YYYY-MM-DD; coerced to Date so sorts are deterministic. */
    date: z.coerce.date(),
    category: z.enum(['rehber', 'duyuru', 'analiz', 'hikaye']),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    locale: z.enum(['tr', 'en']).default('tr'),
  }),
})

export const collections = {
  listingImages,
  blog,
}
