import { Check } from "lucide-react"
import { formatInr } from "../data/product"
import PoweredByFooter from "./PoweredByFooter"

interface PaymentSuccessProps {
  amount: number
  merchantName: string
  email: string
  sessionId: string
  cardLastFour: string
  onDone: () => void
}

function PaymentSuccess({ amount, merchantName, email, sessionId, cardLastFour, onDone }: PaymentSuccessProps) {
  return (
    <div className="flex flex-col items-center space-y-6 p-8 text-center">
      <div
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/20 bg-emerald-50 shadow-lg shadow-emerald-500/10 dodo-animate-pulse-success"
      >
        <Check className="dodo-animate-check h-8 w-8 text-emerald-600" strokeWidth={2.5} />
      </div>

      <div role="status" aria-live="polite" className="space-y-1.5">
        <h2 tabIndex={-1} autoFocus className="text-xl font-bold tracking-tight text-slate-900 focus:outline-none">
          Payment Successful!
        </h2>
        <p className="text-sm text-slate-500">
          Paid <strong className="font-semibold text-slate-800">{formatInr(amount)}</strong> to {merchantName}
        </p>
        {email ? (
          <p className="text-xs text-slate-400">
            Receipt sent to <span className="font-medium text-slate-600">{email}</span>
          </p>
        ) : null}
      </div>

      <div className="w-full space-y-2.5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left text-xs">
        <div className="flex items-center justify-between text-slate-500">
          <span>Transaction ID</span>
          <span className="font-mono font-medium text-slate-700">{sessionId}</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Payment method</span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {cardLastFour ? `Card ending in ${cardLastFour}` : "Card payment"}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Date &amp; Time</span>
          <span className="font-medium text-slate-700">
            {new Date().toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
      </div>

      <div className="w-full space-y-2 pt-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Returning to merchant store...</span>
          <span className="font-medium text-slate-500">Auto-closing</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="dodo-countdown-progress h-full rounded-full bg-emerald-500" />
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
      >
        Done &amp; Return to Merchant
      </button>

      <PoweredByFooter />
    </div>
  )
}

export default PaymentSuccess
