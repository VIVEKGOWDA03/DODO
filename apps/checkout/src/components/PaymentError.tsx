import { AlertTriangle, X } from "lucide-react"
import type { CheckoutErrorInfo } from "../types/checkout"

interface PaymentErrorProps {
  error: CheckoutErrorInfo
}

function PaymentError({ error }: PaymentErrorProps) {
  if (error.code === "NETWORK_ERROR") {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50 p-3.5 text-amber-900"
      >
        <div
          aria-hidden="true"
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"
        >
          <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <div className="flex-1 text-xs">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-amber-800">{error.message}</p>
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              Safe to retry
            </span>
          </div>
          <p className="mt-0.5 leading-relaxed text-amber-700">
            We couldn't confirm the payment. Your payment details are still here and you can safely retry.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      role="alert"
      className="dodo-shake-banner flex items-start gap-3 rounded-xl border border-rose-200/80 bg-rose-50 p-3.5 text-rose-900"
    >
      <div
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </div>
      <div className="flex-1 text-xs">
        <p className="font-semibold text-rose-800">{error.message}</p>
        <p className="mt-0.5 leading-relaxed text-rose-600">
          Please check your card details or try another card.
        </p>
      </div>
    </div>
  )
}

export default PaymentError
