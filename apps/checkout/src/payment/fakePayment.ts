import type { CheckoutErrorCode } from "../types/checkout";

export interface PaymentSuccessResult {
  ok: true;
  sessionId: string;
}

export interface PaymentFailureResult {
  ok: false;
  code: CheckoutErrorCode;
  message: string;
}

export type PaymentResult = PaymentSuccessResult | PaymentFailureResult;

const PAYMENT_DELAY_MS = 1600;

const DECLINED_CARD = "4000000000000002";
const RETRYABLE_CARD = "4000000000000341";

// Retry state lives for the lifetime of this module, i.e. one checkout
// iframe load, so it is never persisted beyond the current payment flow.
const retryableCardAttempts = new Map<string, number>();

function normalizeCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\s+/g, "");
}

function generateSessionId(): string {
  return `sess_${Math.random().toString(36).slice(2, 11)}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processPayment(cardNumber: string): Promise<PaymentResult> {
  await wait(PAYMENT_DELAY_MS);

  const card = normalizeCardNumber(cardNumber);

  if (card === DECLINED_CARD) {
    return {
      ok: false,
      code: "PAYMENT_DECLINED",
      message: "Your card was declined by the bank.",
    };
  }

  if (card === RETRYABLE_CARD) {
    const attempts = (retryableCardAttempts.get(card) ?? 0) + 1;
    retryableCardAttempts.set(card, attempts);

    if (attempts === 1) {
      return {
        ok: false,
        code: "NETWORK_ERROR",
        message: "Connection timed out.",
      };
    }

    return { ok: true, sessionId: generateSessionId() };
  }

  return { ok: true, sessionId: generateSessionId() };
}
