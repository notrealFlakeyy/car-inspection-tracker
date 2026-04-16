import { Car } from '@/lib/types'
import { getStatus, getDaysUntil, formatDate } from '@/lib/statusUtils'

interface Props {
  car: Car
}

const STATUS_STYLES = {
  overdue: { pill: 'bg-[#fce8e6] text-[#d93025]', dot: 'bg-[#d93025]', label: 'Försenad' },
  soon:    { pill: 'bg-[#fef7e0] text-[#b06000]', dot: 'bg-[#f9ab00]', label: 'Snart förfallen' },
  ok:      { pill: 'bg-[#e6f4ea] text-[#137333]', dot: 'bg-[#34a853]', label: 'Aktuell' },
  unknown: { pill: 'bg-[#f1f3f4] text-[#5f6368]', dot: 'bg-[#9aa0a6]', label: 'Inget datum' },
}

// "Budtrans Malax Ab/Oy" → "BT Malax" · "Oravais Servicetrafik Ab" → "Oravais"
function abbrevCompany(name: string): string {
  const words = name.split(' ')
  if (words[0] === 'Budtrans') return 'BT ' + (words[1] ?? '')
  return words[0] ?? name
}

export default function CarCard({ car }: Props) {
  const status = getStatus(car)
  const days = getDaysUntil(car.nextInspection)
  const s = STATUS_STYLES[status]

  let daysText = ''
  if (days !== null) {
    daysText = days < 0 ? `${Math.abs(days)} dagar försenad` : `${days} dagar kvar`
  }

  return (
    <tr className={`border-b border-[#f1f3f4] transition-colors hover:bg-[#f8f9fa] ${car.inactive ? 'opacity-50' : ''}`}>
      {/* Vehicle */}
      <td className="py-3.5 px-4">
        <p className="text-sm font-medium text-[#202124]">{car.name || '—'}</p>
        <p className="text-xs text-[#9aa0a6] font-mono mt-0.5">{car.reg || '—'}</p>
        {car.companies.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {car.companies.map((co) => (
              <span key={co} className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8]">
                {abbrevCompany(co)}
              </span>
            ))}
            {car.sharedOwnership && (
              <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#fef7e0] text-[#b06000]">
                Delad
              </span>
            )}
          </div>
        )}
      </td>

      {/* Last inspected */}
      <td className="py-3.5 px-4 text-sm text-[#5f6368]">
        {formatDate(car.lastInspected)}
      </td>

      {/* Next inspection */}
      <td className="py-3.5 px-4">
        <p className="text-sm text-[#202124]">{formatDate(car.nextInspection)}</p>
        {daysText && <p className="text-xs text-[#9aa0a6] mt-0.5">{daysText}</p>}
      </td>

      {/* Status */}
      <td className="py-3.5 px-4">
        {car.inactive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f1f3f4] text-[#5f6368]">
            Avställd
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
            {s.label}
          </span>
        )}
      </td>
    </tr>
  )
}
