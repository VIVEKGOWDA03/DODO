import { X } from "lucide-react"
import DodoLogo from "./DodoLogo"

interface CheckoutHeaderProps {
  onCloseClick: () => void
  disabled?: boolean
  active?: boolean
}

function CheckoutHeader({ onCloseClick, disabled, active }: CheckoutHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-7 pb-4 pt-6">
      <DodoLogo />
      <button
        type="button"
        aria-label="Close checkout"
        disabled={disabled}
        onClick={onCloseClick}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          active
            ? "bg-slate-200 text-slate-800 ring-2 ring-slate-300"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
        }`}
      >
        <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}

export default CheckoutHeader
