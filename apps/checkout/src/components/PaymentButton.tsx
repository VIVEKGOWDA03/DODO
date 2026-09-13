import { ArrowRight, Loader2, RotateCcw } from "lucide-react"
import { formatInr } from "../data/product"

export type PaymentButtonVariant = "pay" | "processing" | "retry"

interface PaymentButtonProps {
  variant: PaymentButtonVariant
  amount: number
  onClick: () => void
  disabled?: boolean
  retryLabel?: string
}

function PaymentButton({ variant, amount, onClick, disabled, retryLabel = "Retry Payment" }: PaymentButtonProps) {
  if (variant === "processing") {
    return (
      <button
        type="button"
        disabled
        className="flex w-full cursor-wait items-center justify-center gap-3 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md"
      >
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden="true" />
        <span role="status" aria-live="polite">
          Processing {formatInr(amount)}...
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30 active:scale-[0.99] active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {variant === "retry" ? (
        <>
          <span>{retryLabel} &bull; {formatInr(amount)}</span>
          <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </>
      ) : (
        <>
          <span>Pay {formatInr(amount)}</span>
          <ArrowRight
            className="h-4 w-4 text-white/80 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2}
            aria-hidden="true"
          />
        </>
      )}
    </button>
  )
}

export default PaymentButton
