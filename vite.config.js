import { resolve } from 'path'
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nimbus: resolve(__dirname, 'nimbus/index.html'),
        'nimbus-legacy': resolve(__dirname, 'nimbus-legacy/index.html'),
        checklist: resolve(__dirname, 'checklist/index.html'),
      },
    },
  },
  plugins: [react()],
})
