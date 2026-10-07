export const THEME_NAMES = ['Nocturne', 'Ember', 'Tide', 'Graphite', 'Mono'] as const

export type ThemeName = (typeof THEME_NAMES)[number]

export const DEFAULT_THEME: ThemeName = 'Mono'

/** Ground and accent of each theme, for swatches. The full palettes live in app/globals.css. */
export const THEME_SWATCHES: Record<ThemeName, { bg: string; accent: string }> = {
  Nocturne: { bg: '#161826', accent: '#9184d9' },
  Ember: { bg: 'oklch(0.195 0.014 60)', accent: 'oklch(0.72 0.13 62)' },
  Tide: { bg: 'oklch(0.195 0.032 220)', accent: 'oklch(0.72 0.1 185)' },
  Graphite: { bg: 'oklch(0.195 0.006 250)', accent: 'oklch(0.72 0.15 128)' },
  Mono: { bg: 'oklch(0.155 0 0)', accent: 'oklch(0.94 0 0)' },
}

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEME_NAMES as readonly string[]).includes(value)
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme
}
