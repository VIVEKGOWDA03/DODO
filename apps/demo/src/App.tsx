import DodoCheckout from "@dodo/sdk"
import { CheckCircle2, CircleAlert, CircleX, Terminal } from "lucide-react"
import { useState } from "react"
import productImage from "./assets/aura-soundmaster-pro-x.png"

type LogEntry = {
  label: string
  detail?: string
  tone: "info" | "success" | "error" | "neutral"
}

const TONE_STYLES: Record<LogEntry["tone"], string> = {
  info: "text-sky-600",
  success: "text-emerald-600",
  error: "text-red-600",
  neutral: "text-neutral-500",
}

function App() {
  const [log, setLog] = useState<LogEntry[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const append = (entry: LogEntry) => setLog((prev) => [...prev, entry])

  const buy = () => {
    setIsProcessing(true)
    append({ label: "checkout.opened", tone: "info" })
    DodoCheckout.open({
      productId: "prod_123",
      onSuccess: ({ sessionId }) => {
        setIsProcessing(false)
        append({ label: "payment.success", detail: `sessionId=${sessionId}`, tone: "success" })
      },
      onError: ({ code, message }) => {
        setIsProcessing(false)
        append({ label: "payment.error", detail: `${code}: ${message}`, tone: "error" })
      },
      onClose: ({ reason }) => {
        setIsProcessing(false)
        append({ label: "checkout.closed", detail: `reason=${reason}`, tone: "neutral" })
      },
    })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-neutral-50 p-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex aspect-video items-center justify-center bg-linear-to-br from-neutral-900 to-neutral-700 p-8">
            <img src={productImage} alt="Aura SoundMaster Pro X" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col gap-1 p-6">
            <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">Dodo Store</p>
            <h1 className="text-lg font-semibold text-neutral-900">Aura SoundMaster Pro X</h1>
            <p className="text-sm text-neutral-500">Premium wireless audio experience.</p>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-neutral-100 p-6 pt-4">
            <span className="text-2xl font-semibold text-neutral-900">₹24,999</span>
            <button
              type="button"
              disabled={isProcessing}
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
              onClick={buy}
            >
              {isProcessing ? "Processing…" : "Buy Now"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
            <Terminal className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-xs font-medium text-neutral-500">Event log</span>
          </div>
          <div data-testid="event-log" className="flex min-h-32 flex-col gap-1.5 p-4 font-mono text-xs">
            {log.length === 0 ? (
              <span className="text-neutral-300">Waiting for checkout events…</span>
            ) : (
              log.map((entry, i) => (
                <div key={i} className="flex items-start gap-2">
                  {entry.tone === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : entry.tone === "error" ? (
                    <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  ) : entry.tone === "info" ? (
                    <CircleX className="mt-0.5 h-3.5 w-3.5 shrink-0 rotate-45 text-sky-500" />
                  ) : (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />
                  )}
                  <span className={TONE_STYLES[entry.tone]}>
                    {entry.label}
                    {entry.detail ? <span className="text-neutral-400"> {entry.detail}</span> : null}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
