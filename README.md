# Dodo Payments — Tiny Embeddable Checkout

## Overview

A tiny embeddable checkout that a merchant integrates with one script and one API call. The customer never leaves the merchant page — the checkout (email, card, payment state) is isolated inside a cross-origin iframe, and only safe business events (success, error, close) cross back to the merchant via `postMessage`.

Three pieces:

- **`packages/sdk`** — plain TypeScript, no framework dependency. Exposes `DodoCheckout.open()` / `DodoCheckout.close()`.
- **`apps/checkout`** — the checkout UI (React + TypeScript + Vite + Tailwind), rendered inside the iframe. Owns the email/card form, payment states, and a simulated payment engine.
- **`apps/demo`** — a fake merchant storefront with a Buy button and a live SDK event log, so you can see the callbacks firing in real time.

No backend, no database, no real payment gateway — payments are simulated inside the checkout app.

## Running locally

`pnpm` isn't required to be globally installed — `npx` fetches it on demand.

```bash
npx pnpm@9 install
```

Then, in two separate terminals:

```bash
npx pnpm@9 --filter checkout dev   # http://localhost:5174
npx pnpm@9 --filter demo dev       # http://localhost:5173
```

Open **http://localhost:5173** and click **Buy Now**.

(If you'd rather install pnpm globally — `npm install -g pnpm` — you can drop the `npx` prefix and use the root scripts: `pnpm dev:checkout`, `pnpm dev:demo`, `pnpm build`, `pnpm typecheck`.)

## Architecture

```
Demo (merchant page)
   │  DodoCheckout.open({ productId, onSuccess, onError, onClose })
   ▼
SDK (plain TS)
   │  creates overlay + iframe, sends INIT, validates every incoming message
   ▼
Checkout iframe (separate origin)
   │  email, card, fake payment engine, state machine
   │  card details never leave this iframe
   ▼
postMessage (READY / PROCESSING / SUCCESS / ERROR / CLOSED)
   ▼
SDK validates origin + source + checkoutId
   ▼
Merchant callbacks: onSuccess / onError / onClose
```

Full rationale and protocol details are in [ARCHITECTURE.md](./ARCHITECTURE.md). The checkout UI was built against a set of Stitch-generated mockups (one per state: loading/ready/processing/success/declined/network-retry/exit-confirmation) that aren't checked into this repo.

## SDK API

The same call shape works whether you consume the SDK as a module or as a plain script:

```ts
// as a module (e.g. import { DodoCheckout } from "@dodo/sdk" in a bundler-based project —
// here it's a default export: `import DodoCheckout from "@dodo/sdk"`)
// — or as `window.DodoCheckout` after a <script src="dodo-checkout.js"> tag, no bundler at all.

DodoCheckout.open({
  productId: "prod_123",

  onSuccess: ({ sessionId }) => {
    console.log("Payment successful", sessionId);
  },

  onClose: ({ reason }) => {
    // reason: "user" | "success" | "error"
    console.log("Checkout closed", reason);
  },

  onError: ({ code, message }) => {
    // code: "PAYMENT_DECLINED" | "NETWORK_ERROR"
    console.error(code, message);
  },
});

DodoCheckout.close();
```

That's the entire public surface — no iframe details, message protocol, or checkout IDs are exposed.

## Distributing the SDK

`apps/demo` imports `@dodo/sdk`'s TypeScript source directly (a normal workspace package) — that's convenient for development, but it's not what the assignment actually asks for: *"Plain TypeScript, one file a developer can drop into their site."* So the SDK also has its own build, producing exactly that:

```bash
npx pnpm@9 --filter @dodo/sdk build       # production build → dist/dodo-checkout.js
npx pnpm@9 --filter @dodo/sdk build:dev   # same, but pointed at http://localhost:5174 for local testing
```

The output is a single ~3.5KB IIFE that assigns `window.DodoCheckout` directly — no `import.meta.env`, no module system, safe to drop into any HTML page:

```html
<script src="https://your-cdn.example.com/dodo-checkout.js"></script>
<script>
  DodoCheckout.open({ productId: "prod_123", onSuccess, onError, onClose });
</script>
```

`packages/sdk/examples/standalone.html` is a real, zero-build-tooling proof of exactly this — no React, no Vite, no bundler, just a `<script>` tag. To try it:

```bash
npx pnpm@9 --filter @dodo/sdk build:dev
npx pnpm@9 --filter checkout dev   # needs to be running too
npx serve packages/sdk             # serves both examples/ and dist/
```

then open `http://localhost:3000/examples/standalone.html` (port depends on `serve`'s output) and click Buy Now.

The checkout origin is injected at build time (`__DODO_CHECKOUT_URL__`, replaced by each build's `vite.config.ts` `define`) rather than read via `import.meta.env` — that only resolves inside a Vite-processed module, which a plain script tag on a random site never is. The production build currently bakes in a **placeholder** domain (`packages/sdk/vite.config.ts`) — swap in the real deployed checkout origin once `apps/checkout` is hosted somewhere.

## Test cards

Enter any future expiry and any 3-digit CVC.

| Card number | Result |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 0341` | Fails the first attempt (network error), succeeds on retry |

Any other card number succeeds by default (it's a fake engine, not a validator).

## Merchant customization

For this prototype, merchants cannot modify the checkout's internal payment UI. They control the `productId` and receive lifecycle callbacks (`onSuccess`/`onError`/`onClose`) — nothing more.

I intentionally kept the surface small to prevent merchants from creating inconsistent or unsafe payment experiences. A wider customization surface (themeable colors, custom fields, injected copy) is exactly the kind of thing that turns a small, auditable security boundary into a much larger one — every option a merchant can pass in is something the checkout has to trust or sanitize. Nothing here rules it out later; it just wasn't worth the surface area for a first version.

## Decisions

Two I went back and forth on, and actually got wrong the first time:

### Does a retryable error fire its callback once, or every attempt?

I first copied the "fire exactly once" rule straight from `onSuccess` to `onError` too, reasoning that callbacks should be idempotent per checkout. That's wrong for errors: a decline followed by a retry that also fails as a network error needs to reach the merchant *twice* — each is a distinct event the merchant's own logging/analytics should see. I only caught this by scripting the decline → retry → network-fail sequence and watching the second `onError` get silently swallowed. Fixed: `onSuccess` (and the `CLOSED` that follows it) fires at most once per checkout; `onError` fires once per failed attempt, with no such ceiling.

### Where does Escape-to-close live — the SDK, or the checkout app?

My first instinct was the SDK, since that's also where `close()` and the overlay live — one place owning "how the checkout gets dismissed" felt cleaner. It doesn't work: keydown events inside a cross-origin iframe never bubble to the parent document once focus moves into it, so an SDK-level listener goes dead the instant the user starts interacting with the form (which is almost immediately, since email autofocuses on open). Moved the real handling into the checkout app itself, which is also where the focus trap has to live for the identical reason. The SDK keeps a defensive Escape listener for the brief window before focus moves in, but it's not load-bearing.

### iframe vs. popup

**Decision:** iframe.

The assignment wants the customer to remain on the merchant page while card data is isolated. An iframe gives an explicit cross-origin security boundary while keeping the customer on the same page — a popup/new-tab flow would satisfy neither constraint as cleanly.

### `postMessage` vs. shared state / direct DOM access

**Decision:** `window.postMessage`, with an explicit typed protocol (`DODO_CHECKOUT_INIT/READY/CLOSE`, `DODO_PAYMENT_PROCESSING/SUCCESS/ERROR`, `DODO_CHECKOUT_CLOSED`), strict validation of `origin`, `source`, `checkoutId`, and payload shape on every message in both directions, and a `processing` flag the SDK uses to refuse to tear down the checkout — via `close()` or Escape — while a payment is actually in flight, so the merchant is never left without a final answer.

Since the checkout can be embedded on arbitrary merchant domains, the checkout side can't validate against a fixed allowlisted origin. Instead it validates `event.source === window.parent` (the message really came from the frame that embeds it, not some other source) and then trusts-on-first-use: the origin of the first valid `INIT` is pinned and required to match for every message afterward in that session.

### Redux/Zustand vs. local state

**Decision:** local state (a small reducer: `loading → ready → processing → success/error`).

There's exactly one checkout lifecycle with five states. A global state library would add ceremony without solving a problem that exists here.

## What I'd explore next

- Real payment gateway integration behind the same `processPayment()` seam.
- Backend-issued checkout sessions (currently the SDK generates `checkoutId` client-side).
- Stronger payment verification / webhook reconciliation for the final source of truth instead of trusting the iframe's `postMessage`.
- Production-grade iframe isolation review (CSP, `sandbox` attribute tuning).
- Automated integration tests (this was verified manually via scripted Playwright runs during development, not checked into the repo as a test suite).
- Cross-browser/device testing beyond Chromium.
- More payment methods (UPI, netbanking) — the Stitch design already sketches a method switcher.
- Compressing the product image asset (currently an uncompressed ~960KB PNG).
