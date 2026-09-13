function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-7">
      <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
        <div className="dodo-skeleton h-14 w-14 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="dodo-skeleton h-4 w-3/4 rounded" />
          <div className="dodo-skeleton h-3 w-1/3 rounded" />
        </div>
        <div className="dodo-skeleton h-5 w-16 rounded" />
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="dodo-skeleton h-3 w-20 rounded" />
          <div className="dodo-skeleton h-11 w-full rounded-xl" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="dodo-skeleton h-3 w-24 rounded" />
            <div className="dodo-skeleton h-3 w-16 rounded" />
          </div>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
            <div className="dodo-skeleton h-11 w-full" />
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="dodo-skeleton h-11 w-full" />
              <div className="dodo-skeleton h-11 w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="dodo-skeleton h-12 w-full rounded-xl" />
      </div>

      <div className="flex items-center justify-center gap-2 pt-1">
        <div className="dodo-skeleton h-3.5 w-32 rounded" />
      </div>
    </div>
  )
}

export default LoadingSkeleton
