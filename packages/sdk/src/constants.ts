/**
 * Injected at build time via a bundler `define` (see packages/sdk/vite.config.ts
 * for the standalone dist build, and each consuming app's vite.config.ts for
 * in-workspace source consumption). Deliberately NOT read via
 * `import.meta.env` — that only resolves inside a Vite-processed module, but
 * the distributed artifact is a plain script tag on an arbitrary page, where
 * `import.meta` isn't even valid syntax outside a module.
 */
declare const __DODO_CHECKOUT_URL__: string;

export const CHECKOUT_URL: string = __DODO_CHECKOUT_URL__;

export const CHECKOUT_ORIGIN: string = new URL(CHECKOUT_URL).origin;

export const READY_TIMEOUT_MS = 10_000;

export const MESSAGE_TYPES = {
  INIT: "DODO_CHECKOUT_INIT",
  READY: "DODO_CHECKOUT_READY",
  PROCESSING: "DODO_PAYMENT_PROCESSING",
  SUCCESS: "DODO_PAYMENT_SUCCESS",
  ERROR: "DODO_PAYMENT_ERROR",
  CLOSED: "DODO_CHECKOUT_CLOSED",
  CLOSE: "DODO_CHECKOUT_CLOSE",
} as const;
