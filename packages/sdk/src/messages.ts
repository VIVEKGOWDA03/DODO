import type { CheckoutCloseReason, CheckoutErrorCode } from "./types";

export interface InitMessage {
  type: "DODO_CHECKOUT_INIT";
  checkoutId: string;
  productId: string;
}

export interface CloseMessage {
  type: "DODO_CHECKOUT_CLOSE";
  checkoutId: string;
}

export interface ReadyMessage {
  type: "DODO_CHECKOUT_READY";
  checkoutId: string;
}

export interface ProcessingMessage {
  type: "DODO_PAYMENT_PROCESSING";
  checkoutId: string;
}

export interface SuccessMessage {
  type: "DODO_PAYMENT_SUCCESS";
  checkoutId: string;
  sessionId: string;
}

export interface ErrorMessage {
  type: "DODO_PAYMENT_ERROR";
  checkoutId: string;
  code: CheckoutErrorCode;
  message: string;
}

export interface ClosedMessage {
  type: "DODO_CHECKOUT_CLOSED";
  checkoutId: string;
  reason: CheckoutCloseReason;
}

export type SdkToCheckoutMessage = InitMessage | CloseMessage;

export type CheckoutToSdkMessage =
  | ReadyMessage
  | ProcessingMessage
  | SuccessMessage
  | ErrorMessage
  | ClosedMessage;
