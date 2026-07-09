import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    // Tailwind v4 já roda via plugin do Vite acima, sem precisar de PostCSS.
    // Desativado explicitamente para o Vite não subir diretórios e achar um
    // postcss.config.js de outro projeto fora desta pasta.
    postcss: { plugins: [] },
  },
})
