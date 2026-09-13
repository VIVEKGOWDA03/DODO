# Project Instructions

## Goal

Build the Dodo Payments Tiny Embeddable Checkout assignment.

## Architecture

The repository contains:

- `apps/demo` — merchant demo site (React + TypeScript + Vite + Tailwind)
- `apps/checkout` — embeddable checkout app, rendered in a cross-origin iframe (React + TypeScript + Vite + Tailwind)
- `packages/sdk` — plain TypeScript SDK, no React/framework dependency

The full design/architecture rationale lives in [ARCHITECTURE.md](./ARCHITECTURE.md) — read it before making structural changes.

## Important Rules

1. Do not add a backend.
2. Do not add a database.
3. Do not integrate a real payment provider.
4. Do not expose card details to the merchant page.
5. Keep iframe communication through `postMessage`.
6. Always validate message origin and source.
7. Include `checkoutId` in protocol messages.
8. Prevent duplicate payment submissions.
9. Keep the SDK API small.
10. Follow the Stitch design that the checkout UI was originally built against — trust copy is adjusted to avoid unverifiable compliance claims (no "256-bit SSL" / "RBI compliant"; use "Secure checkout" instead). The original Stitch mockup files are not checked into this repo.
11. Do not invent unsupported security/compliance claims.
12. Prefer simple local state over Redux/Zustand.
13. Do not rewrite the architecture without a clear reason.
14. Keep the implementation appropriate for a 6–9 hour take-home assignment.

## Required Test Cards

```
4242 4242 4242 4242 -> success
4000 0000 0000 0002 -> decline
4000 0000 0000 0341 -> fail once, succeed on retry
```

## Known non-obvious implementation details

- The SDK resends `INIT` on a 200ms interval until `READY` arrives (cleared on receipt), because the checkout iframe's `load` event can fire before its React app has mounted its message listener — a single INIT can race and be silently dropped.
- `onError` is NOT subject to the callback-exactly-once rule — declines/network errors are retryable, so each failed attempt fires its own `onError`. Only `onSuccess` (and the `CLOSED` that follows it) fires at most once per checkout.
- Escape-to-close is handled inside the checkout app itself, not the SDK — keydown events inside a cross-origin iframe never bubble to the parent document, so the SDK-level listener can't reliably catch it once focus moves into the iframe.
- The checkout app's `body`/`#root` must stay `background: transparent` — the SDK paints the dim backdrop on the merchant page, behind the iframe; an opaque checkout background would hide it.
- Keyboard focus trapping also has to live inside the checkout iframe for the same reason as Escape — see `useFocusTrap`.
- **`packages/sdk`'s checkout URL is never read via `import.meta.env`.** A plain `<script>` tag on an arbitrary site never goes through Vite, and `import.meta` isn't even legal syntax outside a module — so `constants.ts` instead declares `__DODO_CHECKOUT_URL__` as a value injected by whichever build processes it: the SDK's own `vite.config.ts` (for the standalone `dist/dodo-checkout.js`) and `apps/demo/vite.config.ts` (for when demo bundles the SDK's TS source directly from the workspace). Both must define it — see `packages/sdk/vite.config.ts` and `apps/demo/vite.config.ts`.
- `packages/sdk/src/dodo-checkout.ts` has a **default** export only (`export default DodoCheckout`), specifically so the IIFE build assigns `window.DodoCheckout` directly instead of nesting it under a property. Don't change this back to a named export without changing the build's `output.exports` handling too.
- `pnpm --filter @dodo/sdk build` (the default, no flags) bakes in the **production** placeholder URL (`PROD_CHECKOUT_URL` in `packages/sdk/vite.config.ts` — currently a placeholder, swap in the real deployed checkout origin once it exists). `pnpm --filter @dodo/sdk build:dev` bakes in `localhost:5174` instead, for testing the standalone artifact locally.
- `packages/sdk/examples/standalone.html` is a deliberately tooling-free proof that the built artifact works as a plain `<script src>` on a random page — it must be served over HTTP (not opened via `file://`), since the iframe handshake needs a real origin.
- The SDK tracks `active.processing` (set on `DODO_PAYMENT_PROCESSING`, cleared on `SUCCESS`/`ERROR`) and `close()` is a no-op while it's true — a merchant calling `DodoCheckout.close()` (or pressing Escape) mid-payment must not tear down the checkout before the fake payment engine's promise resolves, or the merchant never learns the outcome. `apps/checkout/src/App.tsx`'s `handleCloseAttempt` has the same guard on its side (`state.status === "processing"`), since Escape is handled independently inside the checkout iframe and doesn't go through the SDK at all.
- `isCheckoutToSdkMessage` in `dodo-checkout.ts` validates each message type's actual payload shape at runtime (`sessionId` is a non-empty string, `code` is one of the two known error codes, `reason` is one of the three known close reasons) — TypeScript's compile-time types say nothing about what a malicious or buggy page actually sends over `postMessage`.

## Before Coding

Inspect the existing project (particularly `apps/checkout/src/components/`) before adding new UI — match the established visual language rather than reinventing it.

Do not create unnecessary files or dependencies.

## Before Finishing

Verify:

- TypeScript passes (`pnpm -r typecheck`)
- production build passes (`pnpm -r build`)
- demo opens checkout
- iframe loads
- success callback works
- decline callback works
- network retry works
- duplicate Pay clicks are blocked
- duplicate checkout opens are blocked
- close callback works
- Escape works
- focus is sensible (trap + autofocus)
- mobile layout works
