import { buildLegacyTheme } from 'sanity'

const props = {
  '--my-white': '#f8fafc',
  '--my-black': '#0f172a',
  '--my-brand': '#8b5cf6', // A vibrant purple/indigo for a premium feel
  '--my-red': '#ef4444',
  '--my-yellow': '#f59e0b',
  '--my-green': '#10b981',
}

export const myTheme = buildLegacyTheme({
  /* Base theme colors */
  '--black': props['--my-black'],
  '--white': props['--my-white'],

  '--gray': '#475569',
  '--gray-base': '#475569',

  '--component-bg': props['--my-black'],
  '--component-text-color': props['--my-white'],

  /* Brand */
  '--brand-primary': props['--my-brand'],

  /* Default button */
  '--default-button-color': '#1e293b',
  '--default-button-primary-color': props['--my-brand'],
  '--default-button-success-color': props['--my-green'],
  '--default-button-warning-color': props['--my-yellow'],
  '--default-button-danger-color': props['--my-red'],

  /* State */
  '--state-info-color': props['--my-brand'],
  '--state-success-color': props['--my-green'],
  '--state-warning-color': props['--my-yellow'],
  '--state-danger-color': props['--my-red'],

  /* Navbar */
  '--main-navigation-color': props['--my-black'],
  '--main-navigation-color--inverted': props['--my-white'],

  '--focus-color': props['--my-brand'],
})
