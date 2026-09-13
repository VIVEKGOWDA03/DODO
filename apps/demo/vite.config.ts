import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
    },
    define: {
      // @dodo/sdk's source reads this instead of import.meta.env directly (see
      // packages/sdk/src/constants.ts) — since we import the SDK's TS source
      // straight from the workspace here, this app's own Vite build is what
      // has to supply that constant, same as the SDK's own standalone build does.
      __DODO_CHECKOUT_URL__: JSON.stringify(env.VITE_CHECKOUT_URL),
    },
  }
})
