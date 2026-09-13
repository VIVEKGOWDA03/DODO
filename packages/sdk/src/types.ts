export type CheckoutCloseReason = "user" | "success" | "error";

export type CheckoutErrorCode = "PAYMENT_DECLINED" | "NETWORK_ERROR";

export interface CheckoutOptions {
  productId: string;
  onSuccess?: (payload: { sessionId: string }) => void;
  onClose?: (payload: { reason: CheckoutCloseReason }) => void;
  onError?: (payload: { code: CheckoutErrorCode; message: string }) => void;
}
