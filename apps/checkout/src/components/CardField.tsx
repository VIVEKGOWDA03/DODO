import { Lock } from "lucide-react"
import {
  detectCardBrand,
  formatCardNumber,
  formatCvc,
  formatExpiry,
  maskCardNumber,
} from "../utils/cardFormatting"

export type CardFieldVariant = "default" | "error" | "warning"

interface CardFieldProps {
  cardNumber: string
  expiry: string
  cvc: string
  onCardNumberChange: (value: string) => void
  onExpiryChange: (value: string) => void
  onCvcChange: (value: string) => void
  variant?: CardFieldVariant
  disabled?: boolean
}

const BRAND_BADGE_STYLES: Record<string, string> = {
  visa: "bg-blue-50 text-blue-700 border-blue-200",
  mastercard: "bg-amber-50 text-amber-700 border-amber-200",
  rupay: "bg-teal-50 text-teal-800 border-teal-200",
}

const BRAND_LABELS: Record<string, string> = {
  visa: "VISA",
  mastercard: "MC",
  rupay: "RUPAY",
}

const CONTAINER_VARIANT_CLASSES: Record<CardFieldVariant, string> = {
  default:
    "border border-slate-200 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 divide-slate-200",
  error: "border-2 border-rose-400 bg-rose-50/20 divide-rose-200",
  warning: "border border-amber-300 bg-amber-50/10 divide-slate-200",
}

const LABEL_VARIANT_CLASSES: Record<CardFieldVariant, string> = {
  default: "text-slate-700",
  error: "text-rose-700",
  warning: "text-slate-700",
}

const INNER_DIVIDER_VARIANT_CLASSES: Record<CardFieldVariant, string> = {
  default: "divide-slate-200",
  error: "divide-rose-200",
  warning: "divide-slate-200",
}

function CardField({
  cardNumber,
  expiry,
  cvc,
  onCardNumberChange,
  onExpiryChange,
  onCvcChange,
  variant = "default",
  disabled,
}: CardFieldProps) {
  const showSingleBrand = disabled || variant !== "default"
  const detectedBrand = detectCardBrand(cardNumber)
  const brandsToShow = showSingleBrand ? [detectedBrand ?? "visa"] : ["visa", "mastercard", "rupay"]

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className={`block text-xs font-semibold uppercase tracking-wider ${LABEL_VARIANT_CLASSES[variant]}`}>
          Card details
        </label>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Lock className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} aria-hidden="true" />
          <span className="text-[11px] font-medium text-slate-500">Secure checkout</span>
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-xl divide-y transition-all ${CONTAINER_VARIANT_CLASSES[variant]}`}
      >
        <div className="relative flex items-center bg-white">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            aria-label="Card number"
            placeholder="Card number"
            value={disabled ? maskCardNumber(cardNumber) : cardNumber}
            readOnly={disabled}
            onChange={(event) => onCardNumberChange(formatCardNumber(event.target.value))}
            className="w-full px-3.5 py-2.5 font-mono text-sm tracking-wide text-slate-800 placeholder-slate-400 focus:outline-none disabled:bg-slate-50"
          />
          <div className="flex items-center gap-1.5 pr-3">
            {brandsToShow.map(
              (brand) =>
                brand && (
                  <span
                    key={brand}
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${BRAND_BADGE_STYLES[brand]}`}
                  >
                    {BRAND_LABELS[brand]}
                  </span>
                ),
            )}
          </div>
        </div>
        <div className={`grid grid-cols-2 divide-x bg-white ${INNER_DIVIDER_VARIANT_CLASSES[variant]}`}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            aria-label="Expiry date, MM slash YY"
            placeholder="MM / YY"
            value={expiry}
            readOnly={disabled}
            onChange={(event) => onExpiryChange(formatExpiry(event.target.value))}
            className="px-3.5 py-2.5 font-mono text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <input
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            aria-label="CVV"
            placeholder="CVV"
            value={cvc}
            readOnly={disabled}
            onChange={(event) => onCvcChange(formatCvc(event.target.value))}
            className="w-full px-3.5 py-2.5 font-mono text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

export default CardField
