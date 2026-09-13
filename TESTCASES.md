# Test Cases

This documents the testing done during development, run against the local dev servers (`apps/demo` on `:5173`, `apps/checkout` on `:5174`) using **Playwright (Chromium)**, driven by short ad-hoc scripts (not checked into the repo — see "Not automated" below).

Legend: ✅ Pass · 🔧 Failed, then fixed and re-verified · ⬜ Not yet tested

---

## 1. SDK ↔ Checkout protocol / lifecycle

| # | Test | Status | Notes |
|---|---|---|---|
| 1.1 | `DodoCheckout.open()` creates overlay + iframe, INIT → READY handshake completes | 🔧 | Found a real race: the iframe's `load` event could fire *before* the checkout React app had mounted its message listener, silently dropping a one-shot `INIT`. Fixed by resending `INIT` every 200ms until `READY` arrives. |
| 1.2 | Success flow: `4242 4242 4242 4242` → `payment.success` with `sessionId` | ✅ | |
| 1.3 | Success → 3s countdown → auto `checkout.closed reason=success` → iframe removed | ✅ | Verified with timed screenshots (t+2.2s vs t+5.7s). |
| 1.4 | Declined: `4000 0000 0000 0002` → `onError(PAYMENT_DECLINED)`, checkout stays open | ✅ | |
| 1.5 | Network error: `4000 0000 0000 0341` first attempt → `onError(NETWORK_ERROR)` | ✅ | |
| 1.6 | Same card, retry → succeeds on 2nd attempt | ✅ | Per-card attempt counter confirmed to reset per fresh checkout session. |
| 1.7 | Retry-after-decline with a **different**, valid card succeeds | ✅ | |
| 1.8 | Repeated failures still each fire their own `onError` (not swallowed after the first) | 🔧 | Found a real bug: the SDK's "fire callback exactly once" guard was applied to `onError` as well as `onSuccess`, so a decline followed by a retry's network error never reached the merchant the second time. Fixed: the exactly-once guard now only applies to `onSuccess`. |
| 1.9 | Duplicate `DodoCheckout.open()` while a checkout is active is ignored (only 1 iframe) | ✅ | Verified via a forced second click (bypassing the fact that the overlay legitimately blocks the underlying button from a real second click). |
| 1.10 | Manual close (checkout's own X button) → `onClose(reason: "user")`, iframe removed | ✅ | |
| 1.11 | Escape key → same close behavior as X | 🔧 | Initially wired at the SDK level (listening on the parent document) — doesn't work, because keydown events inside a cross-origin iframe never bubble to the parent document once focus moves in. Moved the listener into the checkout app itself. |
| 1.12 | Origin/source/checkoutId validation rejects malformed or foreign messages | ✅ | Verified by code review of `messageValidator.ts` + live use (no unexpected message ever got through in any run); no dedicated adversarial-message test script was written. |
| 1.13 | `DodoCheckout.close()` called while a payment is processing is a no-op — checkout stays open, payment completes, `onSuccess` still fires, normal auto-close still happens afterward | 🔧 | Found via external review: the SDK's public `close()` had no guard against being called mid-payment, which could tear down the checkout before the fake payment engine's promise resolved — the merchant would never learn the outcome. Fixed by tracking `active.processing` (set on `DODO_PAYMENT_PROCESSING`, cleared on `SUCCESS`/`ERROR`) and making `close()` a no-op while it's true. Verified against the standalone `<script>`-tag build via `window.DodoCheckout.close()` called mid-payment. |
| 1.14 | Escape key pressed while processing is also a no-op (no exit-confirmation banner, checkout stays open, payment completes normally) | 🔧 | A second instance of the same root bug, found while fixing 1.13: Escape is handled entirely inside the checkout app (independent of the SDK) and had no `processing` guard either, so it could pop the exit-confirmation banner over an active payment. Fixed with the same guard in `App.tsx`'s `handleCloseAttempt`. |
| 1.15 | SDK validates the full payload shape of each incoming message type, not just that `type` is a string | ✅ | `isCheckoutToSdkMessage` now checks `sessionId` is a non-empty string for `SUCCESS`, `code` is one of the two known error codes for `ERROR`, and `reason` is one of the three known values for `CLOSED` — previously it only checked `typeof type === "string"`. Verified indirectly: all normal flows (success/decline/network-retry) still pass with the stricter validator in place, confirming it doesn't reject legitimate messages. No dedicated test forges a malformed payload to confirm rejection. |

## 2. Checkout UI states (visual, vs. Stitch designs)

| # | Test | Status | Notes |
|---|---|---|---|
| 2.1 | Loading skeleton renders | ✅ | |
| 2.2 | Ready state (empty form) — Pay button disabled | ✅ | Screenshot compared against Stitch `2._main_checkout_state`. |
| 2.3 | Ready state (valid form) — Pay button enabled, correct `indigo-600` color | ✅ | Computed style checked directly (`oklch(0.511 0.262 276.966)` = Tailwind `indigo-600` = `#4F46E5`, matches `DESIGN.md`) after a screenshot made the color look lighter than expected — confirmed that was a preview artifact, not a real bug. |
| 2.4 | Processing state — dimmed/readonly fields, masked card number, spinner button, disabled close | ✅ | Screenshot compared against Stitch `3._processing_state`. |
| 2.5 | Success state — checkmark, receipt card (real sessionId/last4/date), countdown bar, "Done" button | ✅ | Screenshot compared against Stitch `4._success_state`. |
| 2.6 | Declined state — rose banner, red-bordered card field, "Try Again" button | ✅ | Screenshot compared against Stitch `5._card_declined_state`. |
| 2.7 | Network-retry state — amber banner, "Safe to retry" badge, "Retry Payment" button | ✅ | Screenshot compared against Stitch `6._network_retry_state`. |
| 2.8 | Exit-confirmation banner — slides in, X gets active ring, content dims | ✅ | Screenshot compared against Stitch `7._exit_confirmation_micro_state`. |
| 2.9 | Mobile viewport (390×844) — bottom-sheet layout, drag handle | 🔧 | First pass: product name truncated awkwardly (`"Aura SoundMaster Pr…"`) because the price column left too little width. Fixed `ProductSummary` spacing/sizing for narrow screens; re-verified. |
| 2.10 | No console/page errors across any of the above | ✅ | Checked on every run. |
| 2.11 | Decline/network-error copy is accurate and doesn't overclaim | 🔧 | Found via external review: the decline banner referenced UPI (a payment method this checkout doesn't offer), and the network-error banner asserted "No money was deducted from your account" — an absolute claim a client-side timeout can't actually guarantee. Fixed: decline now reads "Please check your card details or try another card."; network error now reads "We couldn't confirm the payment. Your payment details are still here and you can safely retry." Verified the new text renders correctly and retry still works after the copy change. |

## 3. Exit-confirmation logic

| # | Test | Status | Notes |
|---|---|---|---|
| 3.1 | X clicked with no data entered → closes immediately, no confirmation shown | ✅ | |
| 3.2 | X clicked after typing anything (email/card/expiry/cvc) → confirmation banner shown | ✅ | |
| 3.3 | "Leave" → `onClose(reason: "user")`, iframe removed | ✅ | |
| 3.4 | "Continue Paying" → banner dismissed, checkout stays open, form data preserved | ✅ | |
| 3.5 | Escape with data entered → same confirmation gate as X (not an immediate close) | ✅ | |

## 4. Demo app

| # | Test | Status | Notes |
|---|---|---|---|
| 4.1 | Buy button opens checkout, event log records `checkout.opened` | ✅ | |
| 4.2 | Full buy → pay → success flow reflected in event log | ✅ | |
| 4.3 | Demo product card matches checkout's product (name/price/image) | 🔧 | Found a real bug: demo showed a generic "Pro Plan — $29/mo" placeholder while checkout showed "Aura SoundMaster Pro X — ₹24,999" for the same `productId`. Fixed by updating the demo's product card copy/image to match the checkout catalog entry. |
| 4.4 | `node_modules`/typescript toolchain sanity (`pnpm typecheck`, `pnpm build`) | 🔧 | Found the `typescript` package missing from the pnpm store (stale install), causing `tsc` to fail outright. Fixed with a fresh `pnpm install`. |

## 5. Accessibility / keyboard

| # | Test | Status | Notes |
|---|---|---|---|
| 5.1 | Initial focus lands on the email field when the form becomes ready | ✅ | Checked `document.activeElement.id === "dodo-email"`. |
| 5.2 | Checkout root exposes `role="dialog" aria-modal="true"` | ✅ | |
| 5.3 | Shift+Tab from the first field moves focus (wrap behavior) | ✅ | |
| 5.4 | Tabbing forward through the whole form never escapes the iframe (15× Tab) | ✅ | Confirmed `document.hasFocus()` stays true inside the checkout frame throughout. |
| 5.5 | Opening exit-confirmation autofocuses "Continue Paying" (the safe default) | ✅ | |
| 5.6 | Core payment flows (success/decline/network-retry) still pass after the focus-trap/autofocus changes | ✅ | Regression re-run, zero console errors. |

## 6. SDK distribution (standalone build)

| # | Test | Status | Notes |
|---|---|---|---|
| 6.1 | `pnpm --filter @dodo/sdk build` produces a single IIFE `dist/dodo-checkout.js` that assigns `window.DodoCheckout` directly | ✅ | Inspected the built output directly — a `var DodoCheckout=(function(){...})();` global, no nesting under `.default`, no `import.meta` anywhere in the emitted file. |
| 6.2 | Production build bakes in the placeholder prod URL; `build:dev` bakes in `localhost:5174` | ✅ | Confirmed via `grep` on the built file for each mode. |
| 6.3 | The built artifact works from a genuinely tooling-free HTML page (no React, no Vite, no bundler) — `<script src>` + `window.DodoCheckout.open()` | ✅ | Real end-to-end run: `window.DodoCheckout` exists, Buy Now opens the real checkout iframe, a full payment completes, `onSuccess` fires back on the plain page. Zero console errors. |
| 6.4 | Demo app (which still bundles the SDK's TS source directly via the workspace) still works after the export/constant-injection changes | ✅ | Full success/decline/network-retry regression re-run against the demo app after switching to a default import and adding the `define` to `apps/demo/vite.config.ts`. |

## Not yet tested

- **Loading-failure fallback** (§32 of ARCHITECTURE.md): the SDK's 10-second `READY_TIMEOUT_MS` → synthetic `NETWORK_ERROR` + auto-close path is implemented but has never actually been triggered/observed in a run (would require simulating a checkout origin that never responds).
- **Cross-browser**: everything above was run in Chromium only, via Playwright. No Firefox/WebKit/Safari or real mobile device testing.
- **Adversarial message testing**: no dedicated script sends a forged/off-origin/mismatched-checkoutId/malformed-payload `postMessage` to confirm it's rejected on either side of the protocol — validated by code inspection and by the fact that no legitimate flow was broken by tightening `isCheckoutToSdkMessage`, not by a forged-message test.
- **Screen reader testing**: ARIA roles/live-regions were added and structurally verified (roles present, focus lands correctly), but not listened to with an actual screen reader (VoiceOver/NVDA).

## Not automated

All of the above were run via short, disposable Playwright scripts in a scratch directory during development (not committed to the repo) — there is no `npm test` / CI-integrated test suite yet. Turning these into a proper checked-in test suite (e.g. Playwright Test) is listed under "What I'd explore next" in `README.md`.
