import { SDK_TO_CHECKOUT_MESSAGE_TYPES } from "./messageProtocol";
import type { SdkToCheckoutMessage } from "./messageProtocol";

const SDK_MESSAGE_TYPES: readonly string[] = Object.values(SDK_TO_CHECKOUT_MESSAGE_TYPES);

type RawMessage = Record<string, unknown>;

/**
 * The checkout is embedded on arbitrary merchant domains, so there is no
 * fixed parent origin to allowlist up front. Instead we require the message
 * to come from this frame's actual parent window, and trust-on-first-use:
 * the origin of the first valid INIT is pinned as the expected origin for
 * every message afterwards.
 */
export function validateSource(event: MessageEvent): boolean {
  return window.parent !== window && event.source === window.parent;
}

export function validateOrigin(event: MessageEvent, trustedOrigin: string | null): boolean {
  return trustedOrigin === null || event.origin === trustedOrigin;
}

export function validateMessageType(data: unknown): data is RawMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as RawMessage).type === "string" &&
    SDK_MESSAGE_TYPES.includes((data as RawMessage).type as string)
  );
}

export function validateCheckoutId(data: RawMessage, expectedCheckoutId: string | null): boolean {
  const checkoutId = data.checkoutId;
  if (typeof checkoutId !== "string" || checkoutId.length === 0) return false;
  return expectedCheckoutId === null || checkoutId === expectedCheckoutId;
}

export function validatePayload(data: RawMessage): boolean {
  if (data.type === SDK_TO_CHECKOUT_MESSAGE_TYPES.INIT) {
    return typeof data.productId === "string" && data.productId.trim().length > 0;
  }
  if (data.type === SDK_TO_CHECKOUT_MESSAGE_TYPES.CLOSE) {
    return true;
  }
  return false;
}

export function validateIncomingMessage(
  event: MessageEvent,
  trustedOrigin: string | null,
  expectedCheckoutId: string | null,
): SdkToCheckoutMessage | null {
  if (!validateSource(event)) return null;
  if (!validateOrigin(event, trustedOrigin)) return null;
  if (!validateMessageType(event.data)) return null;

  const data = event.data as RawMessage;
  if (!validateCheckoutId(data, expectedCheckoutId)) return null;
  if (!validatePayload(data)) return null;

  return data as unknown as SdkToCheckoutMessage;
}
