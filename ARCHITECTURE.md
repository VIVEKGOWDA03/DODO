# Dodo Payments --- Tiny Embeddable Checkout

## Architecture & Implementation Guide

> This document is the implementation blueprint for the Frontend
> Engineer take-home assignment. It is intentionally scoped to a 6--9
> hour build: small, robust, polished, and easy to explain.

------------------------------------------------------------------------

## 1. Assignment Goal

Build a tiny embeddable checkout that a merchant can integrate with one
script and one API call.

The assignment has three pieces:

1.  **SDK** --- plain TypeScript, exposed as a small developer-facing
    API.
2.  **Checkout App** --- a separately hosted web app containing the
    product, email, card form, payment states, and fake payment engine.
3.  **Demo Merchant Site** --- a fake store with a Buy button and
    visible SDK callback/event logs.

The customer must remain on the merchant page while the sensitive card
UI is isolated from the merchant page.

The implementation must also demonstrate handling for:

-   loading
-   successful payment
-   declined payment
-   network failure/retry
-   duplicate clicks
-   checkout close/exit
-   iframe/message failures
-   keyboard and focus behavior
-   responsive/mobile layout

------------------------------------------------------------------------

# 2. Architecture Overview

``` text
┌──────────────────────────────────────────────────────────────┐
│                    DEMO MERCHANT SITE                        │
│                                                              │
│  Product Card                                                │
│  ┌───────────────────────────┐                               │
│  │ Aura SoundMaster Pro X    │                               │
│  │ ₹24,999                   │                               │
│  │                           │                               │
│  │ [ Buy Now ]               │                               │
│  └─────────────┬─────────────┘                               │
│                │                                              │
│                │ DodoCheckout.open(...)                      │
│                ▼                                              │
│        ┌───────────────────┐                                  │
│        │       SDK         │                                  │
│        │ Plain TypeScript  │                                  │
│        └─────────┬─────────┘                                  │
│                  │                                            │
│                  │ creates iframe                            │
│                  ▼                                            │
│       ┌──────────────────────────┐                            │
│       │      Checkout App       │                            │
│       │   Separate origin       │                            │
│       │                          │                            │
│       │ Product                  │                            │
│       │ Email                    │                            │
│       │ Card                     │                            │
│       │ Pay                      │                            │
│       │                          │                            │
│       │ Fake Payment Engine      │                            │
│       └────────────┬─────────────┘                            │
│                    │                                          │
│                    │ postMessage                             │
│                    ▼                                          │
│        ┌──────────────────────┐                               │
│        │ SDK validates event  │                               │
│        └──────────┬───────────┘                               │
│                   │                                           │
│                   ▼                                           │
│        Merchant callbacks                                      │
│        onSuccess / onError / onClose                         │
└──────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 3. Core Security Boundary

The most important architectural decision is:

> The checkout is rendered inside a cross-origin iframe.

The merchant page owns:

-   the product button
-   the SDK
-   the checkout modal/overlay
-   callback handling
-   event logging

The checkout iframe owns:

-   email input
-   card number
-   expiry
-   CVC
-   payment processing state
-   payment success/error state

The merchant page must **never receive raw card details**.

Only safe business events cross the iframe boundary.

``` text
Merchant
   │
   │ productId
   ▼
SDK
   │
   │ INIT
   ▼
Checkout iframe
   │
   │ card details stay here
   │
   │ SUCCESS / ERROR / CLOSED
   ▼
SDK
   │
   ▼
Merchant callbacks
```

------------------------------------------------------------------------

# 4. Technology Stack

## Merchant Demo

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   Lucide React

## Checkout

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   Lucide React

## SDK

-   Plain TypeScript
-   No React dependency
-   No framework dependency
-   Browser APIs only

## Infrastructure

No backend is required.

No database is required.

No real payment gateway is required.

The payment engine is intentionally simulated inside the checkout
application.

------------------------------------------------------------------------

# 5. Repository Structure

``` text
dodo-checkout/
│
├── apps/
│   │
│   ├── checkout/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── CheckoutShell.tsx
│   │   │   │   ├── CheckoutHeader.tsx
│   │   │   │   ├── ProductSummary.tsx
│   │   │   │   ├── EmailField.tsx
│   │   │   │   ├── CardField.tsx
│   │   │   │   ├── PaymentButton.tsx
│   │   │   │   ├── PaymentError.tsx
│   │   │   │   ├── PaymentSuccess.tsx
│   │   │   │   ├── ExitConfirmation.tsx
│   │   │   │   └── LoadingSkeleton.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   └── useCheckout.ts
│   │   │   │
│   │   │   ├── payment/
│   │   │   │   └── fakePayment.ts
│   │   │   │
│   │   │   ├── messaging/
│   │   │   │   ├── messageProtocol.ts
│   │   │   │   └── messageValidator.ts
│   │   │   │
│   │   │   ├── state/
│   │   │   │   └── checkoutState.ts
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── checkout.ts
│   │   │   │
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   │
│   │   └── package.json
│   │
│   └── demo/
│       ├── src/
│       │   ├── components/
│       │   │   ├── ProductCard.tsx
│       │   │   ├── EventLog.tsx
│       │   │   └── DemoHeader.tsx
│       │   │
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       │
│       └── package.json
│
├── packages/
│   └── sdk/
│       ├── src/
│       │   ├── dodo-checkout.ts
│       │   ├── types.ts
│       │   ├── messages.ts
│       │   └── constants.ts
│       └── package.json
│
├── README.md
├── ARCHITECTURE.md
├── CLAUDE.md
├── package.json
└── pnpm-workspace.yaml
```

------------------------------------------------------------------------

# 6. Public SDK API

Keep the public API intentionally small.

``` ts
DodoCheckout.open({
  productId: "prod_123",

  onSuccess: ({ sessionId }) => {
    console.log("Payment successful", sessionId);
  },

  onClose: ({ reason }) => {
    console.log("Checkout closed", reason);
  },

  onError: ({ code, message }) => {
    console.error(code, message);
  },
});
```

Also expose:

``` ts
DodoCheckout.close();
```

Avoid exposing internal iframe details, message protocol, checkout IDs,
or DOM implementation details.

------------------------------------------------------------------------

# 7. SDK Types

``` ts
export type CheckoutCloseReason =
  | "user"
  | "success"
  | "error";

export type CheckoutErrorCode =
  | "PAYMENT_DECLINED"
  | "NETWORK_ERROR";

export interface CheckoutOptions {
  productId: string;

  onSuccess?: (payload: {
    sessionId: string;
  }) => void;

  onClose?: (payload: {
    reason: CheckoutCloseReason;
  }) => void;

  onError?: (payload: {
    code: CheckoutErrorCode;
    message: string;
  }) => void;
}
```

------------------------------------------------------------------------

# 8. SDK Lifecycle

When the merchant calls:

``` ts
DodoCheckout.open(...)
```

the SDK should:

``` text
1. Validate configuration
        ↓
2. Check if checkout is already open
        ↓
3. Generate checkoutId
        ↓
4. Create modal overlay
        ↓
5. Create iframe
        ↓
6. Attach message listener
        ↓
7. Load checkout application
        ↓
8. Send INIT message
        ↓
9. Wait for READY
        ↓
10. Display checkout
        ↓
11. Listen for payment events
        ↓
12. Fire merchant callback
        ↓
13. Cleanup on close
```

------------------------------------------------------------------------

# 9. Duplicate Checkout Protection

If a merchant does this:

``` ts
DodoCheckout.open(...);

DodoCheckout.open(...);
```

do not create two checkout instances.

Preferred behavior:

``` text
First open
   ↓
Checkout active

Second open
   ↓
Ignore
```

This prevents:

-   two overlays
-   two iframes
-   conflicting callbacks
-   multiple payment flows

A console warning can be added during development:

``` text
DodoCheckout: checkout is already open.
```

------------------------------------------------------------------------

# 10. Checkout ID

Every checkout instance gets a unique ID.

Example:

``` text
chk_m8f3k29x
```

Every message contains this ID.

Example:

``` ts
{
  type: "DODO_PAYMENT_SUCCESS",
  checkoutId: "chk_m8f3k29x",
  sessionId: "sess_abc123"
}
```

This prevents stale iframe messages from affecting a newer checkout.

------------------------------------------------------------------------

# 11. Cross-Window Communication

Use:

``` ts
window.postMessage()
```

Do not directly access the iframe's React state or DOM.

This keeps the SDK and checkout application independent.

------------------------------------------------------------------------

# 12. Message Protocol

## SDK → Checkout

### Initialize

``` ts
{
  type: "DODO_CHECKOUT_INIT",
  checkoutId: string,
  productId: string
}
```

### Close

``` ts
{
  type: "DODO_CHECKOUT_CLOSE"
}
```

------------------------------------------------------------------------

## Checkout → SDK

### Ready

``` ts
{
  type: "DODO_CHECKOUT_READY",
  checkoutId: string
}
```

### Processing

``` ts
{
  type: "DODO_PAYMENT_PROCESSING",
  checkoutId: string
}
```

### Success

``` ts
{
  type: "DODO_PAYMENT_SUCCESS",
  checkoutId: string,
  sessionId: string
}
```

### Error

``` ts
{
  type: "DODO_PAYMENT_ERROR",
  checkoutId: string,
  code: "PAYMENT_DECLINED" | "NETWORK_ERROR",
  message: string
}
```

### Closed

``` ts
{
  type: "DODO_CHECKOUT_CLOSED",
  checkoutId: string,
  reason: "user" | "success" | "error"
}
```

------------------------------------------------------------------------

# 13. Message Validation

Never trust arbitrary `postMessage` events.

The SDK should validate:

``` text
event.origin
       +
event.source
       +
message.type
       +
checkoutId
```

Example:

``` ts
if (event.origin !== CHECKOUT_ORIGIN) {
  return;
}

if (event.source !== iframe.contentWindow) {
  return;
}

if (message.checkoutId !== activeCheckoutId) {
  return;
}
```

Do not use:

``` ts
window.postMessage(message, "*");
```

when a known checkout origin can be used.

Use the explicit checkout origin.

------------------------------------------------------------------------

# 14. Security Boundary

The merchant can know:

``` text
productId
payment status
sessionId
error code
error message
close reason
```

The merchant cannot know:

``` text
card number
expiry
CVC
raw payment fields
```

This is a key part of the assignment's security evaluation.

------------------------------------------------------------------------

# 15. Checkout State Machine

Use explicit local state.

Do not add Redux/Zustand unless the implementation genuinely needs it.

``` text
                ┌───────────┐
                │  loading  │
                └─────┬─────┘
                      │
                      ▼
                ┌───────────┐
                │   ready   │
                └─────┬─────┘
                      │
                 Pay clicked
                      │
                      ▼
              ┌────────────────┐
              │   processing   │
              └───────┬────────┘
                      │
              ┌───────┴─────────┐
              │                 │
              ▼                 ▼
          success             error
              │                 │
              │          ┌──────┴───────┐
              │          │              │
              │       declined       network
              │          │              │
              │          ▼              ▼
              │       retry          retry
              │
              ▼
            closed
```

Suggested states:

``` ts
type CheckoutState =
  | "loading"
  | "ready"
  | "processing"
  | "success"
  | "error";
```

------------------------------------------------------------------------

# 16. Stitch Design Mapping

The Stitch design should be treated as the visual source of truth for
the checkout UI.

Implement these states:

## Loading

-   skeleton product information
-   skeleton input fields
-   disabled payment area
-   subtle motion

## Main Checkout

-   Dodo Checkout branding
-   product name
-   product price
-   quantity/color information
-   email field
-   card fields
-   card brand indicators
-   security reassurance
-   Pay button
-   close button

## Processing

Button:

``` text
Processing ₹24,999...
```

Supporting copy:

``` text
Communicating with your bank.
Please do not refresh or back out.
```

Disable:

-   Pay button
-   card inputs
-   duplicate submission

## Success

Show:

-   green success indicator
-   Payment Successful
-   amount
-   receipt email
-   transaction/session identifier
-   payment method
-   date/time
-   automatic close countdown
-   Done & Return to Merchant

## Card Declined

Show:

-   red error treatment
-   card field error
-   clear explanation
-   retry action

Example:

``` text
Your card was declined by the bank.
Please check your details or try another card.
```

## Network Retry

Use a different visual treatment from card decline.

Example:

``` text
Connection timed out

No money was deducted from your account.
Your payment details are safely preserved.
```

Button:

``` text
Retry Payment • ₹24,999
```

## Exit Confirmation

If the user clicks close after entering card data:

``` text
Leave checkout?

Your entered payment details will be cleared.
```

Actions:

``` text
Leave
Continue Paying
```

------------------------------------------------------------------------

# 17. Security Copy

Do not claim security/compliance properties that the demo does not
actually implement.

Avoid unsupported statements such as:

``` text
RBI compliant
PCI compliant
256-bit SSL
```

Prefer:

``` text
Secure checkout
Your payment information is protected
```

The UI should communicate trust without making unverifiable compliance
claims.

------------------------------------------------------------------------

# 18. Fake Payment Engine

Create:

``` text
apps/checkout/src/payment/fakePayment.ts
```

API:

``` ts
export async function processPayment(cardNumber: string) {
  // simulated payment
}
```

Use a short artificial delay:

``` text
User clicks Pay
      ↓
processing
      ↓
wait ~1.5–2 seconds
      ↓
result
```

------------------------------------------------------------------------

# 19. Required Test Cards

The assignment specifies:

``` text
4242 4242 4242 4242
→ Success

4000 0000 0000 0002
→ Declined

4000 0000 0000 0341
→ First attempt fails
→ Retry succeeds
```

The `0341` behavior must be tracked only for the current
checkout/payment flow.

Example:

``` ts
const retryableCardAttempts = new Map<string, number>();
```

Or a simpler checkout-local attempt counter.

Do not persist payment state in localStorage unless necessary.

------------------------------------------------------------------------

# 20. Double Payment Protection

The Pay button must become disabled immediately after submission.

``` text
READY
  ↓
click Pay
  ↓
PROCESSING
  ↓
button disabled
```

If the user clicks multiple times, only one payment attempt is started.

Example guard:

``` ts
if (state === "processing") {
  return;
}
```

------------------------------------------------------------------------

# 21. Error Handling

There are two primary fake payment errors.

## Payment Declined

``` ts
{
  code: "PAYMENT_DECLINED",
  message: "Your card was declined by the bank."
}
```

The user stays inside the checkout and can retry.

## Network Error

``` ts
{
  code: "NETWORK_ERROR",
  message: "Connection timed out."
}
```

The entered payment form can remain available for retry.

The merchant receives the error through:

``` ts
onError({
  code,
  message
});
```

------------------------------------------------------------------------

# 22. Host Must Always Learn the Result

The SDK must make sure the merchant receives the final truth.

Success:

``` ts
onSuccess({
  sessionId
});
```

Failure:

``` ts
onError({
  code,
  message
});
```

User exit:

``` ts
onClose({
  reason: "user"
});
```

Successful close:

``` ts
onClose({
  reason: "success"
});
```

Error close:

``` ts
onClose({
  reason: "error"
});
```

Do not silently remove the iframe without informing the merchant.

------------------------------------------------------------------------

# 23. Callback Exactly-Once Rule

Callbacks should not fire multiple times for the same lifecycle.

Example:

``` text
payment success
      ↓
onSuccess() once
      ↓
success UI
      ↓
auto close
      ↓
onClose("success") once
```

Avoid:

``` text
success
success
close
close
```

Use lifecycle guards inside the SDK.

------------------------------------------------------------------------

# 24. Success Flow

Recommended:

``` text
Payment succeeds
      ↓
Checkout sends SUCCESS
      ↓
SDK fires onSuccess()
      ↓
Checkout displays success state
      ↓
3 second countdown
      ↓
Checkout sends CLOSED(success)
      ↓
SDK fires onClose()
      ↓
iframe removed
      ↓
merchant continues
```

The user can also manually click:

``` text
Done & Return to Merchant
```

------------------------------------------------------------------------

# 25. Close Flow

When the user clicks X:

### If nothing sensitive was entered

Close immediately.

### If card/payment data was entered

Show:

``` text
Leave checkout?

Your entered payment details will be cleared.
```

If user selects:

``` text
Continue Paying
```

stay in checkout.

If user selects:

``` text
Leave
```

send:

``` ts
{
  type: "DODO_CHECKOUT_CLOSED",
  checkoutId,
  reason: "user"
}
```

Then the SDK removes the iframe.

------------------------------------------------------------------------

# 26. SDK DOM Structure

The SDK can create:

``` html
<div data-dodo-checkout-overlay>
  <div data-dodo-checkout-backdrop>
    <div data-dodo-checkout-dialog>
      <iframe
        title="Dodo Checkout"
        src="..."
      />
    </div>
  </div>
</div>
```

The merchant does not need to create any of this.

------------------------------------------------------------------------

# 27. Focus Management

When the modal opens:

``` text
Merchant page
      ↓
Buy button
      ↓
checkout opens
      ↓
focus moves into checkout
```

When checkout closes:

``` text
focus returns to Buy button
```

Support:

-   Tab
-   Shift + Tab
-   Enter
-   Space
-   Escape

Escape should follow the same close/confirmation behavior as the X
button.

------------------------------------------------------------------------

# 28. Scroll Lock

When checkout is open:

``` ts
document.body.style.overflow = "hidden";
```

Restore the original body overflow when closed.

This prevents the merchant page from scrolling behind the checkout.

------------------------------------------------------------------------

# 29. Responsive Behavior

## Desktop

Centered modal:

``` text
┌─────────────────────────────────────┐
│             Merchant                │
│                                     │
│       ┌───────────────────┐         │
│       │     Checkout      │         │
│       │                   │         │
│       │                   │         │
│       └───────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

## Mobile

Near full-screen:

``` text
┌───────────────────────┐
│ Checkout          X   │
├───────────────────────┤
│ Product               │
│                       │
│ Email                 │
│                       │
│ Card                  │
│                       │
│                       │
│ [ Pay ₹24,999 ]       │
└───────────────────────┘
```

The checkout should not feel like a desktop modal squeezed onto mobile.

------------------------------------------------------------------------

# 30. Demo Merchant Site

The demo should make integration obvious.

Example:

``` text
┌─────────────────────────────────────────────┐
│ Dodo Store                                  │
├─────────────────────────────────────────────┤
│                                             │
│ Aura SoundMaster Pro X                      │
│ Premium wireless audio experience           │
│                                             │
│ ₹24,999                                     │
│                                             │
│ [ Buy Now ]                                 │
│                                             │
├─────────────────────────────────────────────┤
│ SDK Event Log                               │
│                                             │
│ checkout.opened                             │
│ checkout.ready                              │
│ payment.processing                          │
│ payment.success                             │
│ checkout.closed                             │
└─────────────────────────────────────────────┘
```

The callback log is important because it proves the SDK/checkout
communication is working.

------------------------------------------------------------------------

# 31. Event Log

Example:

``` ts
[
  {
    type: "checkout.opened",
    time: "11:42:12"
  },
  {
    type: "payment.processing",
    time: "11:42:25"
  },
  {
    type: "payment.success",
    sessionId: "sess_demo_123",
    time: "11:42:27"
  }
]
```

Display the log in the demo site.

This gives reviewers an immediate way to test the integration.

------------------------------------------------------------------------

# 32. Loading Failure

Do not allow the skeleton to hang forever.

Recommended behavior:

``` text
Loading
  ↓
wait ~8–10 seconds
  ↓
Still not ready?
  ↓
"Taking longer than expected"
  ↓
Try Again
```

This is especially important because loading/error states are explicitly
part of the assignment.

------------------------------------------------------------------------

# 33. Checkout Message Validation

Create:

``` text
messaging/messageValidator.ts
```

Responsibilities:

``` text
validateOrigin()
validateSource()
validateMessageType()
validateCheckoutId()
validatePayload()
```

Keep validation separate from the React UI.

This makes the protocol easier to reason about and test.

------------------------------------------------------------------------

# 34. Suggested Constants

``` ts
export const CHECKOUT_ORIGIN =
  import.meta.env.VITE_CHECKOUT_ORIGIN;

export const MESSAGE_TYPES = {
  INIT: "DODO_CHECKOUT_INIT",
  READY: "DODO_CHECKOUT_READY",
  PROCESSING: "DODO_PAYMENT_PROCESSING",
  SUCCESS: "DODO_PAYMENT_SUCCESS",
  ERROR: "DODO_PAYMENT_ERROR",
  CLOSED: "DODO_CHECKOUT_CLOSED",
  CLOSE: "DODO_CHECKOUT_CLOSE",
} as const;
```

For the deployed demo, configure the checkout origin through environment
variables.

------------------------------------------------------------------------

# 35. Deployment Model

Deploy the applications separately.

Example:

``` text
Demo:
https://dodo-demo.vercel.app

Checkout:
https://dodo-checkout.vercel.app
```

The SDK runs inside the demo page but loads the checkout from the
separate checkout origin.

This demonstrates the cross-origin architecture.

------------------------------------------------------------------------

# 36. Local Development

Recommended ports:

``` text
Demo:
http://localhost:5173

Checkout:
http://localhost:5174
```

Environment:

``` env
VITE_CHECKOUT_URL=http://localhost:5174
VITE_CHECKOUT_ORIGIN=http://localhost:5174
```

Production:

``` env
VITE_CHECKOUT_URL=https://your-checkout-domain.example
VITE_CHECKOUT_ORIGIN=https://your-checkout-domain.example
```

------------------------------------------------------------------------

# 37. Monorepo Commands

Example root `package.json`:

``` json
{
  "scripts": {
    "dev:demo": "pnpm --filter demo dev",
    "dev:checkout": "pnpm --filter checkout dev",
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck"
  }
}
```

Run:

``` bash
pnpm install
```

Then:

``` bash
pnpm dev:checkout
```

and in another terminal:

``` bash
pnpm dev:demo
```

------------------------------------------------------------------------

# 38. Claude / VS Code Working Agreement

Create a root:

``` text
CLAUDE.md
```

Use it to instruct Claude to follow this architecture.

Suggested contents:

``` md
# Project Instructions

## Goal

Build the Dodo Payments Tiny Embeddable Checkout assignment.

## Architecture

The repository contains:

- apps/demo
- apps/checkout
- packages/sdk

The SDK is plain TypeScript.
The checkout and demo are React + TypeScript applications.

## Important Rules

1. Do not add a backend.
2. Do not add a database.
3. Do not integrate a real payment provider.
4. Do not expose card details to the merchant page.
5. Keep iframe communication through postMessage.
6. Always validate message origin and source.
7. Include checkoutId in protocol messages.
8. Prevent duplicate payment submissions.
9. Keep the SDK API small.
10. Follow the Stitch design for checkout UI.
11. Do not invent unsupported security/compliance claims.
12. Prefer simple local state over Redux/Zustand.
13. Do not rewrite the architecture without a clear reason.
14. Keep the implementation appropriate for a 6–9 hour take-home assignment.

## Required Test Cards

4242 4242 4242 4242 -> success

4000 0000 0000 0002 -> decline

4000 0000 0000 0341 -> fail once, succeed on retry

## Before Coding

Inspect the existing project and Stitch design references.

Do not create unnecessary files or dependencies.

## Before Finishing

Verify:

- TypeScript passes
- production build passes
- demo opens checkout
- iframe loads
- success callback works
- decline callback works
- network retry works
- duplicate Pay clicks are blocked
- duplicate checkout opens are blocked
- close callback works
- Escape works
- focus is sensible
- mobile layout works
```

------------------------------------------------------------------------

# 39. Stitch MCP Workflow

The Stitch design should be used as the visual reference, not blindly
converted into a huge component tree.

Recommended workflow with Claude + Stitch MCP:

``` text
Stitch design
      ↓
Claude inspects design/reference
      ↓
Identify:
  - layout
  - typography
  - spacing
  - colors
  - components
  - states
      ↓
Implement CheckoutShell
      ↓
Implement state components
      ↓
Implement responsive behavior
      ↓
Compare implementation against Stitch
      ↓
Polish differences
```

The implementation should preserve the important visual hierarchy from
Stitch while keeping the architecture simple.

### MCP rule

Do not hard-code a guessed Stitch MCP package name or command into the
repository.

Configure the Stitch MCP server through the MCP configuration supported
by the Claude/VS Code setup you are actually using. Keep
provider-specific MCP credentials/configuration outside the project
source.

The repository should depend on the resulting design/reference, not on
the MCP server being available at runtime.

------------------------------------------------------------------------

# 40. Using Claude Efficiently

Do not ask Claude:

``` text
Build the entire assignment.
```

Instead use small implementation stages.

### Stage 1

``` text
Set up the monorepo with:
- apps/demo
- apps/checkout
- packages/sdk

Use TypeScript, React, Vite and Tailwind.
Do not implement checkout logic yet.
```

### Stage 2

``` text
Implement the SDK iframe lifecycle and public API.
Use the architecture in ARCHITECTURE.md.
Do not implement the UI yet.
```

### Stage 3

``` text
Implement the postMessage protocol.
Add origin/source/checkoutId validation.
```

### Stage 4

``` text
Implement the checkout state machine and fake payment engine.
```

### Stage 5

``` text
Implement the Stitch checkout UI.
Start with the ready state, then add processing, success,
declined, network retry, loading and exit confirmation.
```

### Stage 6

``` text
Connect the checkout UI to the SDK protocol.
```

### Stage 7

``` text
Implement the demo merchant site and callback event log.
```

### Stage 8

``` text
Test all assignment scenarios and polish accessibility,
responsive behavior and motion.
```

------------------------------------------------------------------------

# 41. Architecture Decisions

## Decision 1 --- iframe vs popup

### Considered

Popup/new tab:

``` text
Merchant → new checkout page
```

Iframe:

``` text
Merchant
   ↓
Checkout iframe
```

### Decision

Use an iframe.

### Why

The assignment specifically wants the customer to remain on the merchant
page while the checkout is hosted separately.

An iframe provides:

-   isolated checkout UI
-   cross-origin boundary
-   merchant remains on the same page
-   controlled SDK communication
-   clear security boundary

------------------------------------------------------------------------

# 42. Architecture Decision 2 --- postMessage vs shared state

### Considered

Shared state / direct DOM:

``` text
Merchant
   ↕
Checkout
```

### Decision

Use:

``` text
window.postMessage
```

### Why

The checkout is a separately hosted application.

`postMessage` gives us an explicit communication contract and avoids
coupling the merchant application to checkout implementation details.

It also makes the boundary easy to explain:

``` text
SDK → protocol → iframe
iframe → protocol → SDK
```

------------------------------------------------------------------------

# 43. Architecture Decision 3 --- Redux vs local state

### Considered

Redux/Zustand.

### Decision

Use local React state.

### Why

There is only one checkout lifecycle.

The state is small:

``` text
loading
ready
processing
success
error
```

Adding a global state library would increase complexity without
improving the architecture.

------------------------------------------------------------------------

# 44. What We Are NOT Building

To keep the scope appropriate:

``` text
No real payment gateway
No backend
No database
No authentication
No webhooks
No PCI implementation
No real card tokenization
No merchant dashboard
No multi-product catalog
No subscriptions
No production fraud system
```

This is a frontend architecture exercise.

------------------------------------------------------------------------

# 45. Testing Checklist

## SDK

-   [ ] `DodoCheckout.open()` works
-   [ ] invalid config is handled
-   [ ] duplicate open is ignored
-   [ ] iframe is created
-   [ ] iframe is removed on close
-   [ ] callbacks fire once
-   [ ] origin validation works
-   [ ] source validation works
-   [ ] checkoutId validation works

## Checkout

-   [ ] loading state
-   [ ] ready state
-   [ ] processing state
-   [ ] success state
-   [ ] declined state
-   [ ] network retry state
-   [ ] exit confirmation
-   [ ] duplicate payment protection
-   [ ] Escape
-   [ ] focus
-   [ ] responsive layout

## Test Cards

-   [ ] 4242 succeeds
-   [ ] 0002 declines
-   [ ] 0341 fails once
-   [ ] 0341 succeeds on retry

## Demo

-   [ ] Buy button works
-   [ ] event log updates
-   [ ] success callback visible
-   [ ] error callback visible
-   [ ] close callback visible

------------------------------------------------------------------------

# 46. Final Demo Flow

The reviewer should be able to do this:

``` text
Open demo
   ↓
Click Buy Now
   ↓
Loading skeleton
   ↓
Checkout appears
   ↓
Enter:
4242 4242 4242 4242
   ↓
Pay
   ↓
Processing
   ↓
Payment Successful
   ↓
onSuccess(sessionId)
   ↓
Checkout closes
   ↓
onClose(success)
```

Then test:

``` text
4000 0000 0000 0002
```

Expected:

``` text
Card declined
   ↓
onError(PAYMENT_DECLINED)
   ↓
Try Again
```

Then:

``` text
4000 0000 0000 0341
```

Expected:

``` text
Attempt 1
   ↓
Network error
   ↓
Retry
   ↓
Attempt 2
   ↓
Success
```

------------------------------------------------------------------------

# 47. README Requirements

The final README should contain:

## Overview

What the project does.

## Running locally

``` bash
pnpm install
pnpm dev:checkout
pnpm dev:demo
```

## Architecture

Brief explanation of:

``` text
Demo → SDK → iframe → checkout
```

## SDK API

Show:

``` ts
DodoCheckout.open({
  productId: "prod_123",
  onSuccess,
  onClose,
  onError,
});
```

## Test cards

List all three cards.

## Decisions

Explain the two main architectural decisions.

## What I'd explore next

Possible next steps:

-   real payment integration
-   backend session creation
-   stronger payment verification
-   webhook reconciliation
-   production-grade iframe isolation
-   automated integration tests
-   browser compatibility testing
-   more payment methods

------------------------------------------------------------------------

# 48. Final Quality Bar

Before submitting, ask:

### Taste

Does this look deliberately designed?

### UI

Does it feel trustworthy enough for a payment flow?

### Judgment

Can every open-ended decision be explained?

### Security

Can the merchant ever see raw card details?

The answer should be:

``` text
No.
```

### API

Can a developer understand the SDK in under a minute?

### Robustness

What happens if:

-   payment fails?
-   network fails?
-   user clicks twice?
-   checkout takes too long?
-   iframe sends an unexpected message?
-   user closes while entering payment data?

### Craft

Are:

-   focus
-   keyboard
-   spacing
-   loading
-   error copy
-   transitions
-   mobile layout

finished?

### Ownership

Does it feel like a small product rather than a coding exercise?

------------------------------------------------------------------------

# 49. Implementation Order

Follow this exact order to avoid getting stuck in UI details too early.

``` text
1. Monorepo setup
        ↓
2. SDK skeleton
        ↓
3. iframe creation
        ↓
4. postMessage protocol
        ↓
5. checkout state machine
        ↓
6. fake payment engine
        ↓
7. Stitch ready UI
        ↓
8. loading state
        ↓
9. processing state
        ↓
10. success state
        ↓
11. declined state
        ↓
12. network retry state
        ↓
13. exit confirmation
        ↓
14. demo site
        ↓
15. callback event log
        ↓
16. accessibility
        ↓
17. responsive polish
        ↓
18. testing
        ↓
19. README
        ↓
20. deployment
```

------------------------------------------------------------------------

# 50. Golden Rule

> Keep the SDK small, keep card data inside the checkout iframe, make
> the message boundary explicit, handle failure states properly, and
> spend the final time polishing the experience.

The goal is not to build a production payment platform.

The goal is to show that you can take an intentionally incomplete
checkout brief and make strong frontend, API, security, UX, and
engineering decisions.
