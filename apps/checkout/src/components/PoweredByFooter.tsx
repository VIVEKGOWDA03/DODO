function PoweredByFooter({ withDivider }: { withDivider?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 pt-2 ${withDivider ? "border-t border-slate-100" : ""}`}>
      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
        <span>Powered by</span>
        <span className="font-bold tracking-tight text-slate-700">Dodo Payments</span>
      </div>
    </div>
  )
}

export default PoweredByFooter
