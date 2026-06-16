import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/send-otp': {
        target: 'https://r1dznwxd2b.execute-api.us-east-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/send-otp/, '/prod/send-otp'),
      },
      '/api/verify-otp': {
        target: 'https://r1dznwxd2b.execute-api.us-east-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/verify-otp/, '/prod/verify-otp'),
      },
    },
  },
})
