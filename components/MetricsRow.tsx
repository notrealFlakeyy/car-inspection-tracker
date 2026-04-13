import { Car } from '@/lib/types'
import { getStatus } from '@/lib/statusUtils'

interface Props {
  cars: Car[]
}

export default function MetricsRow({ cars }: Props) {
  const overdue = cars.filter((c) => getStatus(c) === 'overdue').length
  const soon = cars.filter((c) => getStatus(c) === 'soon').length
  const ok = cars.filter((c) => getStatus(c) === 'ok').length

  const cards = [
    { label: 'Total vehicles', value: cars.length, color: 'text-gray-900' },
    { label: 'Overdue', value: overdue, color: 'text-red-600' },
    { label: 'Due within 30 days', value: soon, color: 'text-amber-600' },
    { label: 'Up to date', value: ok, color: 'text-green-600' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-gray-500">{c.label}</p>
          <p className={`mt-1 text-3xl font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}
