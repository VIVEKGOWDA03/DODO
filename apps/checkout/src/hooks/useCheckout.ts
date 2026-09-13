import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  createClosedMessage,
  createErrorMessage,
  createProcessingMessage,
  createReadyMessage,
  createSuccessMessage,
  postToParent,
  SDK_TO_CHECKOUT_MESSAGE_TYPES,
} from "../messaging/messageProtocol";
import { validateIncomingMessage } from "../messaging/messageValidator";
import { processPayment } from "../payment/fakePayment";
import { checkoutReducer, initialCheckoutState } from "../state/checkoutState";
import type { CheckoutCloseReason } from "../types/checkout";

const SUCCESS_AUTO_CLOSE_MS = 3000;

export function useCheckout(onCloseRequested: () => void) {
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckoutState);
  const [productId, setProductId] = useState<string | null>(null);

  const checkoutIdRef = useRef<string | null>(null);
  const trustedOriginRef = useRef<string | null>(null);
  const closedRef = useRef(false);
  const onCloseRequestedRef = useRef(onCloseRequested);
  onCloseRequestedRef.current = onCloseRequested;

  const sendClosed = useCallback((reason: CheckoutCloseReason) => {
    if (closedRef.current) return;
    if (!checkoutIdRef.current || !trustedOriginRef.current) return;
    closedRef.current = true;
    postToParent(createClosedMessage(checkoutIdRef.current, reason), trustedOriginRef.current);
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const message = validateIncomingMessage(event, trustedOriginRef.current, checkoutIdRef.current);
      if (!message) return;

      if (message.type === SDK_TO_CHECKOUT_MESSAGE_TYPES.INIT) {
        if (checkoutIdRef.current) return;
        checkoutIdRef.current = message.checkoutId;
        trustedOriginRef.current = event.origin;
        setProductId(message.productId);
        postToParent(createReadyMessage(message.checkoutId), event.origin);
        dispatch({ type: "READY" });
        return;
      }

      if (message.type === SDK_TO_CHECKOUT_MESSAGE_TYPES.CLOSE) {
        onCloseRequestedRef.current();
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const submitPayment = useCallback(
    (cardNumber: string) => {
      if (state.status === "processing") return;
      if (!checkoutIdRef.current || !trustedOriginRef.current) return;

      const checkoutId = checkoutIdRef.current;
      const origin = trustedOriginRef.current;

      dispatch({ type: "SUBMIT_PAYMENT" });
      postToParent(createProcessingMessage(checkoutId), origin);

      void processPayment(cardNumber).then((result) => {
        if (checkoutIdRef.current !== checkoutId) return;

        if (result.ok) {
          dispatch({ type: "PAYMENT_SUCCEEDED", sessionId: result.sessionId });
          postToParent(createSuccessMessage(checkoutId, result.sessionId), origin);
          window.setTimeout(() => sendClosed("success"), SUCCESS_AUTO_CLOSE_MS);
        } else {
          dispatch({ type: "PAYMENT_FAILED", error: { code: result.code, message: result.message } });
          postToParent(createErrorMessage(checkoutId, result.code, result.message), origin);
        }
      });
    },
    [sendClosed, state.status],
  );

  const retry = useCallback(() => {
    dispatch({ type: "RETRY" });
  }, []);

  const requestClose = useCallback(() => {
    sendClosed(state.status === "success" ? "success" : "user");
  }, [sendClosed, state.status]);

  useEffect(() => {
    // Keydown events inside this iframe never reach the parent document, so
    // Escape has to be handled here rather than by the SDK. Routed through
    // the same onCloseRequested gate as the X button so exit confirmation
    // still applies.
    function onKeydown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCloseRequestedRef.current();
    }

    document.addEventListener("keydown", onKeydown, true);
    return () => document.removeEventListener("keydown", onKeydown, true);
  }, []);

  return { state, productId, submitPayment, retry, requestClose };
}
