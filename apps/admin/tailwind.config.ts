import type { Config } from 'tailwindcss'
import preset from '@learnhub/config/tailwind'

const config: Config = {
  presets: [preset as Partial<Config>],
  content: ['./src/**/*.{ts,tsx}'],
}
export default config
