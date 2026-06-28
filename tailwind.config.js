import { venatorUIPreset } from '@venator-ui/tokens'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  presets: [venatorUIPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // Venator ships class strings inside its dist — scan it so its utilities emit.
    './node_modules/@venator-ui/ui/dist/index.mjs',
  ],
  theme: {
    extend: {
      // Survey typography: Space Grotesk for display/UI, IBM Plex Mono for data.
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
