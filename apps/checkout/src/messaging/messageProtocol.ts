import type { CheckoutCloseReason, CheckoutErrorCode } from "../types/checkout";

export const SDK_TO_CHECKOUT_MESSAGE_TYPES = {
  INIT: "DODO_CHECKOUT_INIT",
  CLOSE: "DODO_CHECKOUT_CLOSE",
} as const;

export const CHECKOUT_TO_SDK_MESSAGE_TYPES = {
  READY: "DODO_CHECKOUT_READY",
  PROCESSING: "DODO_PAYMENT_PROCESSING",
  SUCCESS: "DODO_PAYMENT_SUCCESS",
  ERROR: "DODO_PAYMENT_ERROR",
  CLOSED: "DODO_CHECKOUT_CLOSED",
} as const;

export interface InitMessage {
  type: typeof SDK_TO_CHECKOUT_MESSAGE_TYPES.INIT;
  checkoutId: string;
  productId: string;
}

export interface CloseMessage {
  type: typeof SDK_TO_CHECKOUT_MESSAGE_TYPES.CLOSE;
  checkoutId: string;
}

export type SdkToCheckoutMessage = InitMessage | CloseMessage;

export interface ReadyMessage {
  type: typeof CHECKOUT_TO_SDK_MESSAGE_TYPES.READY;
  checkoutId: string;
}

export interface ProcessingMessage {
  type: typeof CHECKOUT_TO_SDK_MESSAGE_TYPES.PROCESSING;
  checkoutId: string;
}

export interface SuccessMessage {
  type: typeof CHECKOUT_TO_SDK_MESSAGE_TYPES.SUCCESS;
  checkoutId: string;
  sessionId: string;
}

export interface ErrorMessage {
  type: typeof CHECKOUT_TO_SDK_MESSAGE_TYPES.ERROR;
  checkoutId: string;
  code: CheckoutErrorCode;
  message: string;
}

export interface ClosedMessage {
  type: typeof CHECKOUT_TO_SDK_MESSAGE_TYPES.CLOSED;
  checkoutId: string;
  reason: CheckoutCloseReason;
}

export type CheckoutToSdkMessage =
  | ReadyMessage
  | ProcessingMessage
  | SuccessMessage
  | ErrorMessage
  | ClosedMessage;

export function createReadyMessage(checkoutId: string): ReadyMessage {
  return { type: CHECKOUT_TO_SDK_MESSAGE_TYPES.READY, checkoutId };
}

export function createProcessingMessage(checkoutId: string): ProcessingMessage {
  return { type: CHECKOUT_TO_SDK_MESSAGE_TYPES.PROCESSING, checkoutId };
}

export function createSuccessMessage(checkoutId: string, sessionId: string): SuccessMessage {
  return { type: CHECKOUT_TO_SDK_MESSAGE_TYPES.SUCCESS, checkoutId, sessionId };
}

export function createErrorMessage(
  checkoutId: string,
  code: CheckoutErrorCode,
  message: string,
): ErrorMessage {
  return { type: CHECKOUT_TO_SDK_MESSAGE_TYPES.ERROR, checkoutId, code, message };
}

export function createClosedMessage(checkoutId: string, reason: CheckoutCloseReason): ClosedMessage {
  return { type: CHECKOUT_TO_SDK_MESSAGE_TYPES.CLOSED, checkoutId, reason };
}

export function postToParent(message: CheckoutToSdkMessage, targetOrigin: string): void {
  window.parent.postMessage(message, targetOrigin);
}
