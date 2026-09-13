export type CheckoutState = "loading" | "ready" | "processing" | "success" | "error";

export type CheckoutCloseReason = "user" | "success" | "error";

export type CheckoutErrorCode = "PAYMENT_DECLINED" | "NETWORK_ERROR";

export interface CheckoutErrorInfo {
  code: CheckoutErrorCode;
  message: string;
}
