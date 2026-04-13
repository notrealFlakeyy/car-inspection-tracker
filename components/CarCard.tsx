import { Car } from '@/lib/types'
import { getStatus, getDaysUntil, formatDate } from '@/lib/statusUtils'

interface Props {
  car: Car
}

const badgeConfig = {
  overdue: { label: 'Overdue', bg: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  soon: { label: 'Due soon', bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  ok: { label: 'Up to date', bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  unknown: { label: 'No date', bg: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
}

export default function CarCard({ car }: Props) {
  const status = getStatus(car)
  const days = getDaysUntil(car.nextInspection)
  const badge = badgeConfig[status]

  let daysText = ''
  if (days !== null) {
    if (days < 0) daysText = `${Math.abs(days)} days overdue`
    else daysText = `${days} days remaining`
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center">
      {/* Vehicle */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900">{car.name || '—'}</p>
        <p className="mt-0.5 truncate text-sm text-gray-500">{car.reg || '—'}</p>
      </div>

      {/* Last inspected */}
      <div className="w-36 shrink-0">
        <p className="text-xs text-gray-400">Last inspected</p>
        <p className="mt-0.5 text-sm font-medium text-gray-700">{formatDate(car.lastInspected)}</p>
      </div>

      {/* Next inspection */}
      <div className="w-36 shrink-0">
        <p className="text-xs text-gray-400">Next inspection</p>
        <p className="mt-0.5 text-sm font-medium text-gray-700">{formatDate(car.nextInspection)}</p>
      </div>

      {/* Status */}
      <div className="w-32 shrink-0">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${badge.bg}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
        {daysText && <p className="mt-1 text-xs text-gray-500">{daysText}</p>}
      </div>
    </div>
  )
}
