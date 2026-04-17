import { Car } from '@/lib/types'
import { getStatus } from '@/lib/statusUtils'

interface Props {
  cars: Car[]
}

interface StatCardProps {
  label: string
  value: number
  valueColor: string
}

function StatCard({ label, value, valueColor }: StatCardProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#dadce0] bg-white px-4 py-4 sm:px-6 sm:py-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368] sm:text-xs">{label}</p>
      <p className={`mt-1 text-3xl font-light sm:text-4xl ${valueColor}`}>{value}</p>
    </div>
  )
}

export default function MetricsRow({ cars }: Props) {
  const active = cars.filter((c) => !c.inactive)
  const overdue = active.filter((c) => getStatus(c) === 'overdue').length
  const soon = active.filter((c) => getStatus(c) === 'soon').length
  const ok = active.filter((c) => getStatus(c) === 'ok').length

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Totalt fordon" value={cars.length} valueColor="text-[#202124]" />
      <StatCard label="F\u00F6rsenade" value={overdue} valueColor="text-[#d93025]" />
      <StatCard label="Inom 30 dagar" value={soon} valueColor="text-[#b06000]" />
      <StatCard label="Aktuella" value={ok} valueColor="text-[#137333]" />
    </div>
  )
}
