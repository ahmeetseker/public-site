// Lightbox state reducer — pure, deterministic, well-typed.
// Used by `<LightboxRoot>` (page-level mount) and tested in isolation.
//
// State shape: open/closed flag + currently-displayed image index + total
// image count (set by LightboxRoot once it scans the [data-gallery] tree).
//
// Actions:
//   - `open`  { index } — opens the modal at the given index (clamped to
//     valid range; out-of-range falls back to 0).
//   - `close`              — keeps the last index but marks modal closed.
//   - `next` / `prev`      — wrap-around navigation; no-op when total <= 1.
//   - `goto` { index }    — direct jump (e.g. thumbnail click). Out-of-range
//     is silently ignored to keep the user where they were.
//
// The reducer never mutates state and never reads from `window`; the modal
// owns all DOM/keyboard side-effects.

export type LightboxState = {
  open: boolean
  index: number
  total: number
}

export type LightboxAction =
  | { type: 'open'; index: number }
  | { type: 'close' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'goto'; index: number }
  | { type: 'setTotal'; total: number }

export interface LightboxImage {
  src: string
  alt: string
  index: number
}

export function lightboxReducer(
  state: LightboxState,
  action: LightboxAction,
): LightboxState {
  switch (action.type) {
    case 'open': {
      const safe =
        action.index >= 0 && action.index < state.total ? action.index : 0
      return { ...state, open: true, index: safe }
    }
    case 'close':
      return { ...state, open: false }
    case 'next': {
      if (state.total <= 1) return state
      return { ...state, index: (state.index + 1) % state.total }
    }
    case 'prev': {
      if (state.total <= 1) return state
      return { ...state, index: (state.index - 1 + state.total) % state.total }
    }
    case 'goto': {
      const safe =
        action.index >= 0 && action.index < state.total
          ? action.index
          : state.index
      return { ...state, index: safe }
    }
    case 'setTotal': {
      // Sync the live image count discovered after mount (LightboxRoot scans
      // [data-gallery]). Clamp the current index so it stays in range when the
      // list shrinks (e.g. hot-reload during development).
      const total = Math.max(0, Math.floor(action.total))
      const index = total === 0 ? 0 : Math.min(state.index, total - 1)
      return { ...state, total, index }
    }
  }
}
