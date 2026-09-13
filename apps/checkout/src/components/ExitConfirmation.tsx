interface ExitConfirmationProps {
  onLeave: () => void
  onContinue: () => void
}

function ExitConfirmation({ onLeave, onContinue }: ExitConfirmationProps) {
  return (
    <div
      role="alertdialog"
      aria-label="Discard payment details?"
      className="dodo-animate-drop-in flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-6 py-4 text-white shadow-inner"
    >
      <div className="space-y-0.5">
        <p className="text-xs font-semibold tracking-tight text-white">Discard payment details?</p>
        <p className="text-[11px] text-slate-400">Your entered card info will not be saved.</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onLeave}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          Leave
        </button>
        <button
          type="button"
          autoFocus
          onClick={onContinue}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
        >
          Continue Paying
        </button>
      </div>
    </div>
  )
}

export default ExitConfirmation
