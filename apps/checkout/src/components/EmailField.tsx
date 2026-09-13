interface EmailFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function EmailField({ value, onChange, disabled }: EmailFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="dodo-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
        Email address
      </label>
      <input
        id="dodo-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={value}
        disabled={disabled}
        autoFocus
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  )
}

export default EmailField
