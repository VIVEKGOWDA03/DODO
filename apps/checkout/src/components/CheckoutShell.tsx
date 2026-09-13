import { forwardRef } from "react"
import type { ReactNode } from "react"

interface CheckoutShellProps {
  header: ReactNode
  children: ReactNode
}

const CheckoutShell = forwardRef<HTMLDivElement, CheckoutShellProps>(function CheckoutShell(
  { header, children },
  ref,
) {
  return (
    <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Dodo Checkout"
        className="flex max-h-[92vh] min-h-[480px] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200/80 bg-white shadow-2xl sm:max-h-[90vh] sm:min-h-0 sm:max-w-[460px] sm:rounded-2xl"
      >
        <div className="flex justify-center pb-1 pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-300/70" />
        </div>
        {header}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
})

export default CheckoutShell
