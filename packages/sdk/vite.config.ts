import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// TODO: replace with the real deployed checkout origin once apps/checkout is deployed.
const PROD_CHECKOUT_URL = "https://dodo-checkout-demo.example.com";
const DEV_CHECKOUT_URL = "http://localhost:5174";

export default defineConfig(({ mode }) => ({
  define: {
    __DODO_CHECKOUT_URL__: JSON.stringify(mode === "production" ? PROD_CHECKOUT_URL : DEV_CHECKOUT_URL),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL("src/dodo-checkout.ts", import.meta.url)),
      name: "DodoCheckout",
      formats: ["iife"],
      fileName: () => "dodo-checkout.js",
    },
  },
}));
