import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Porta fixada em 3000 para bater com o CORS / trustedOrigins
// já configurados na mimos-da-alo-api.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})
