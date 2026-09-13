import type { CheckoutErrorInfo, CheckoutState } from "../types/checkout";

export interface CheckoutStateSnapshot {
  status: CheckoutState;
  error: CheckoutErrorInfo | null;
  sessionId: string | null;
}

export const initialCheckoutState: CheckoutStateSnapshot = {
  status: "loading",
  error: null,
  sessionId: null,
};

export type CheckoutAction =
  | { type: "READY" }
  | { type: "SUBMIT_PAYMENT" }
  | { type: "PAYMENT_SUCCEEDED"; sessionId: string }
  | { type: "PAYMENT_FAILED"; error: CheckoutErrorInfo }
  | { type: "RETRY" };

export function checkoutReducer(
  state: CheckoutStateSnapshot,
  action: CheckoutAction,
): CheckoutStateSnapshot {
  switch (action.type) {
    case "READY":
      return state.status === "loading" ? { ...state, status: "ready" } : state;

    case "SUBMIT_PAYMENT":
      return state.status === "ready" || state.status === "error"
        ? { ...state, status: "processing", error: null }
        : state;

    case "PAYMENT_SUCCEEDED":
      return state.status === "processing"
        ? { ...state, status: "success", sessionId: action.sessionId }
        : state;

    case "PAYMENT_FAILED":
      return state.status === "processing"
        ? { ...state, status: "error", error: action.error }
        : state;

    case "RETRY":
      return state.status === "error" ? { ...state, status: "ready", error: null } : state;

    default:
      return state;
  }
}
