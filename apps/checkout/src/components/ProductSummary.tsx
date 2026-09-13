import { formatInr } from "../data/product"

interface ProductSummaryProps {
  name: string
  variant: string
  quantity: number
  price: number
  image: string
  dimmed?: boolean
}

function ProductSummary({ name, variant, quantity, price, image, dimmed }: ProductSummaryProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 transition-opacity sm:gap-4 ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200/70 bg-white p-1.5 shadow-sm sm:h-14 sm:w-14">
        <img src={image} alt={name} className="h-full w-full object-contain" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-slate-900">{name}</h3>
        <p className="truncate text-xs text-slate-500">
          Color: {variant} &bull; Qty: {quantity}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">{formatInr(price)}</span>
      </div>
    </div>
  )
}

export default ProductSummary
