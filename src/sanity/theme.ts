import { buildLegacyTheme } from 'sanity'

const props = {
  '--my-white': '#f7f7f8', // Soft off-white to prevent brightness
  '--my-black': '#1a1a1a',
  '--my-brand': '#000000', // Sleek black branding
  '--my-red': '#ef4444',
  '--my-yellow': '#f59e0b',
  '--my-green': '#10b981',
}

export const myTheme = buildLegacyTheme({
  '--black': props['--my-black'],
  '--white': props['--my-white'],

  '--gray': '#737373',
  '--gray-base': '#737373',

  '--component-bg': '#ffffff',
  '--component-text-color': props['--my-black'],

  '--brand-primary': props['--my-brand'],

  '--default-button-color': '#e5e5e5',
  '--default-button-primary-color': props['--my-brand'],
  '--default-button-success-color': props['--my-green'],
  '--default-button-warning-color': props['--my-yellow'],
  '--default-button-danger-color': props['--my-red'],

  '--state-info-color': props['--my-brand'],
  '--state-success-color': props['--my-green'],
  '--state-warning-color': props['--my-yellow'],
  '--state-danger-color': props['--my-red'],

  '--main-navigation-color': '#f0f0f0',
  '--main-navigation-color--inverted': props['--my-black'],

  '--focus-color': '#525252',
})
