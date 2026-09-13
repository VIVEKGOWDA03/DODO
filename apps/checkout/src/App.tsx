import { useCallback, useRef, useState } from "react"
import CardField from "./components/CardField"
import CheckoutHeader from "./components/CheckoutHeader"
import CheckoutShell from "./components/CheckoutShell"
import EmailField from "./components/EmailField"
import ExitConfirmation from "./components/ExitConfirmation"
import LoadingSkeleton from "./components/LoadingSkeleton"
import PaymentButton from "./components/PaymentButton"
import PaymentError from "./components/PaymentError"
import PaymentSuccess from "./components/PaymentSuccess"
import PoweredByFooter from "./components/PoweredByFooter"
import ProductSummary from "./components/ProductSummary"
import { getProduct } from "./data/product"
import { useCheckout } from "./hooks/useCheckout"
import { useFocusTrap } from "./hooks/useFocusTrap"
import { lastFourDigits } from "./utils/cardFormatting"

function App() {
  const [email, setEmail] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const hasEnteredData =
    email.trim().length > 0 ||
    cardNumber.replace(/\D/g, "").length > 0 ||
    expiry.replace(/\D/g, "").length > 0 ||
    cvc.length > 0

  // useCheckout needs this callback before `state`/`requestClose` exist, and
  // the callback needs those in turn, so the indirection goes through a ref.
  const handleCloseAttemptRef = useRef<() => void>(() => {})
  const { state, productId, submitPayment, requestClose } = useCheckout(() =>
    handleCloseAttemptRef.current(),
  )

  const handleCloseAttempt = useCallback(() => {
    // A payment is in flight — the close button is already disabled for this
    // reason, but Escape and an incoming SDK CLOSE both route through this
    // same function, so it needs its own guard too.
    if (state.status === "processing") return
    if (state.status === "success" || !hasEnteredData) {
      requestClose()
      return
    }
    setShowExitConfirm(true)
  }, [state.status, hasEnteredData, requestClose])
  handleCloseAttemptRef.current = handleCloseAttempt

  const handleLeave = useCallback(() => {
    setShowExitConfirm(false)
    requestClose()
  }, [requestClose])

  const handleContinue = useCallback(() => setShowExitConfirm(false), [])

  const product = getProduct(productId)

  const cardDigits = cardNumber.replace(/\D/g, "")
  const expiryDigits = expiry.replace(/\D/g, "")
  const isFormValid =
    /^\S+@\S+\.\S+$/.test(email) && cardDigits.length >= 13 && expiryDigits.length === 4 && cvc.length >= 3

  const handleSubmit = useCallback(() => {
    if (!isFormValid) return
    submitPayment(cardNumber)
  }, [isFormValid, submitPayment, cardNumber])

  const handleDone = useCallback(() => {
    requestClose()
  }, [requestClose])

  const isProcessing = state.status === "processing"

  const shellRef = useRef<HTMLDivElement>(null)
  useFocusTrap(shellRef)

  return (
    <CheckoutShell
      ref={shellRef}
      header={
        <CheckoutHeader
          onCloseClick={handleCloseAttempt}
          disabled={isProcessing}
          active={showExitConfirm}
        />
      }
    >
      {showExitConfirm ? <ExitConfirmation onLeave={handleLeave} onContinue={handleContinue} /> : null}

      <div className={showExitConfirm ? "pointer-events-none opacity-50" : ""}>
        {state.status === "loading" ? <LoadingSkeleton /> : null}

        {state.status === "success" ? (
          <PaymentSuccess
            amount={product.price}
            merchantName={product.merchantName}
            email={email}
            sessionId={state.sessionId ?? ""}
            cardLastFour={lastFourDigits(cardNumber)}
            onDone={handleDone}
          />
        ) : null}

        {state.status === "ready" || state.status === "processing" || state.status === "error" ? (
          <div className="space-y-4 p-7">
            <ProductSummary
              name={product.name}
              variant={product.variant}
              quantity={product.quantity}
              price={product.price}
              image={product.image}
              dimmed={isProcessing}
            />

            {state.status === "error" && state.error ? <PaymentError error={state.error} /> : null}

            <div className={`space-y-4 ${isProcessing ? "pointer-events-none opacity-60" : ""}`}>
              <EmailField value={email} onChange={setEmail} disabled={isProcessing} />
              <CardField
                cardNumber={cardNumber}
                expiry={expiry}
                cvc={cvc}
                onCardNumberChange={setCardNumber}
                onExpiryChange={setExpiry}
                onCvcChange={setCvc}
                variant={state.status === "error" ? (state.error?.code === "NETWORK_ERROR" ? "warning" : "error") : "default"}
                disabled={isProcessing}
              />
            </div>

            <PaymentButton
              variant={isProcessing ? "processing" : state.status === "error" ? "retry" : "pay"}
              retryLabel={state.error?.code === "PAYMENT_DECLINED" ? "Try Again" : "Retry Payment"}
              amount={product.price}
              onClick={handleSubmit}
              disabled={!isProcessing && !isFormValid}
            />

            <PoweredByFooter />
          </div>
        ) : null}
      </div>
    </CheckoutShell>
  )
}

export default App
