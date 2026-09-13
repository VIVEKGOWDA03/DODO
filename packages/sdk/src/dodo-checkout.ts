import { CHECKOUT_ORIGIN, CHECKOUT_URL, MESSAGE_TYPES, READY_TIMEOUT_MS } from "./constants";
import type { CheckoutToSdkMessage, SdkToCheckoutMessage } from "./messages";
import type { CheckoutCloseReason, CheckoutOptions } from "./types";

interface ActiveCheckout {
  checkoutId: string;
  options: CheckoutOptions;
  overlay: HTMLDivElement;
  iframe: HTMLIFrameElement;
  previousActiveElement: Element | null;
  previousBodyOverflow: string;
  readyTimeoutId: number;
  initIntervalId: number;
  processing: boolean;
  succeeded: boolean;
  closed: boolean;
}

let active: ActiveCheckout | null = null;

function generateCheckoutId(): string {
  return `chk_${Math.random().toString(36).slice(2, 11)}`;
}

function createOverlay(): { overlay: HTMLDivElement; iframe: HTMLIFrameElement } {
  const overlay = document.createElement("div");
  overlay.setAttribute("data-dodo-checkout-overlay", "");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
  });

  const backdrop = document.createElement("div");
  backdrop.setAttribute("data-dodo-checkout-backdrop", "");
  Object.assign(backdrop.style, {
    position: "absolute",
    inset: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(15, 15, 20, 0.5)",
  });

  const dialog = document.createElement("div");
  dialog.setAttribute("data-dodo-checkout-dialog", "");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", "Dodo Checkout");
  Object.assign(dialog.style, {
    position: "relative",
    width: "100%",
    height: "100%",
  });

  const iframe = document.createElement("iframe");
  iframe.title = "Dodo Checkout";
  iframe.src = CHECKOUT_URL;
  Object.assign(iframe.style, {
    width: "100%",
    height: "100%",
    border: "0",
    display: "block",
  });

  dialog.appendChild(iframe);
  backdrop.appendChild(dialog);
  overlay.appendChild(backdrop);

  return { overlay, iframe };
}

function sendToCheckout(message: SdkToCheckoutMessage): void {
  active?.iframe.contentWindow?.postMessage(message, CHECKOUT_ORIGIN);
}

function isCheckoutToSdkMessage(data: unknown): data is CheckoutToSdkMessage {
  if (typeof data !== "object" || data === null) return false;
  const message = data as Record<string, unknown>;
  if (typeof message.checkoutId !== "string" || message.checkoutId.length === 0) return false;

  // TypeScript's compile-time types say nothing about what actually arrives
  // over postMessage — validate each message type's payload shape, not just
  // that `type` happens to be a string.
  switch (message.type) {
    case MESSAGE_TYPES.READY:
    case MESSAGE_TYPES.PROCESSING:
      return true;
    case MESSAGE_TYPES.SUCCESS:
      return typeof message.sessionId === "string" && message.sessionId.length > 0;
    case MESSAGE_TYPES.ERROR:
      return (
        (message.code === "PAYMENT_DECLINED" || message.code === "NETWORK_ERROR") &&
        typeof message.message === "string"
      );
    case MESSAGE_TYPES.CLOSED:
      return message.reason === "user" || message.reason === "success" || message.reason === "error";
    default:
      return false;
  }
}

function handleMessage(event: MessageEvent): void {
  if (!active) return;
  if (event.origin !== CHECKOUT_ORIGIN) return;
  if (event.source !== active.iframe.contentWindow) return;
  if (!isCheckoutToSdkMessage(event.data)) return;

  const message = event.data;
  if (message.checkoutId !== active.checkoutId) return;

  switch (message.type) {
    case MESSAGE_TYPES.READY:
      window.clearTimeout(active.readyTimeoutId);
      window.clearInterval(active.initIntervalId);
      return;
    case MESSAGE_TYPES.PROCESSING:
      active.processing = true;
      return;
    case MESSAGE_TYPES.SUCCESS:
      active.processing = false;
      if (active.succeeded) return;
      active.succeeded = true;
      active.options.onSuccess?.({ sessionId: message.sessionId });
      return;
    case MESSAGE_TYPES.ERROR:
      // Declines/network errors are retryable, so each attempt's failure is
      // reported; only a message arriving after SUCCESS is stale and ignored.
      active.processing = false;
      if (active.succeeded) return;
      active.options.onError?.({ code: message.code, message: message.message });
      return;
    case MESSAGE_TYPES.CLOSED:
      finalizeClose(message.reason);
      return;
  }
}

function finalizeClose(reason: CheckoutCloseReason): void {
  if (!active || active.closed) return;
  const { options } = active;
  active.closed = true;
  teardown();
  options.onClose?.({ reason });
}

function teardown(): void {
  if (!active) return;
  window.clearTimeout(active.readyTimeoutId);
  window.clearInterval(active.initIntervalId);
  window.removeEventListener("message", handleMessage);
  document.removeEventListener("keydown", handleKeydown, true);
  active.overlay.remove();
  document.body.style.overflow = active.previousBodyOverflow;
  if (active.previousActiveElement instanceof HTMLElement) {
    active.previousActiveElement.focus();
  }
  active = null;
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== "Escape" || !active) return;
  event.preventDefault();
  close();
}

function open(options: CheckoutOptions): void {
  if (!options || typeof options.productId !== "string" || options.productId.trim() === "") {
    throw new Error("DodoCheckout: `productId` is required.");
  }

  if (active) {
    console.warn("DodoCheckout: checkout is already open.");
    return;
  }

  const checkoutId = generateCheckoutId();
  const { overlay, iframe } = createOverlay();

  // No dedicated "load failed" error code exists in the protocol, so a stalled
  // READY handshake (dead checkout origin, blocked iframe, etc.) is reported as
  // a network error rather than left to hang indefinitely.
  const readyTimeoutId = window.setTimeout(() => {
    if (active?.checkoutId !== checkoutId) return;
    active.options.onError?.({
      code: "NETWORK_ERROR",
      message: "Checkout is taking longer than expected to load.",
    });
    finalizeClose("error");
  }, READY_TIMEOUT_MS);

  active = {
    checkoutId,
    options,
    overlay,
    iframe,
    previousActiveElement: document.activeElement,
    previousBodyOverflow: document.body.style.overflow,
    readyTimeoutId,
    initIntervalId: 0,
    processing: false,
    succeeded: false,
    closed: false,
  };

  document.body.style.overflow = "hidden";
  window.addEventListener("message", handleMessage);
  document.addEventListener("keydown", handleKeydown, true);

  iframe.addEventListener(
    "load",
    () => {
      if (active?.checkoutId !== checkoutId) return;
      // The checkout app's message listener may not be attached the instant
      // the iframe's `load` event fires (it mounts via React after the module
      // graph finishes evaluating), so a single INIT can race the listener
      // and be missed. Resending on an interval until READY arrives makes the
      // handshake reliable regardless of that timing.
      sendToCheckout({ type: MESSAGE_TYPES.INIT, checkoutId, productId: options.productId });
      active.initIntervalId = window.setInterval(() => {
        sendToCheckout({ type: MESSAGE_TYPES.INIT, checkoutId, productId: options.productId });
      }, 200);
    },
    { once: true },
  );

  document.body.appendChild(overlay);
  iframe.focus();
}

function close(): void {
  if (!active) return;
  // A payment is in flight inside the iframe; tearing down now would mean its
  // eventual SUCCESS/ERROR message arrives at a checkout that no longer
  // exists, and the merchant never learns the outcome. Ignore the request —
  // the checkout's own UI already disables its close affordance for the same
  // reason while processing.
  if (active.processing) return;
  sendToCheckout({ type: MESSAGE_TYPES.CLOSE, checkoutId: active.checkoutId });
}

const DodoCheckout = { open, close };

// A single default export (not a named one) is what lets the standalone IIFE
// build assign `window.DodoCheckout` directly to this object, instead of
// nesting it under a property of the global.
export default DodoCheckout;

export type { CheckoutCloseReason, CheckoutErrorCode, CheckoutOptions } from "./types";
