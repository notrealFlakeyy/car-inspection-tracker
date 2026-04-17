import { Car } from '@/lib/types'
import { getStatus, getDaysUntil, formatDate } from '@/lib/statusUtils'
import { abbrevCompany, formatDaysLabel, STATUS_STYLES } from '@/lib/carPresentation'

interface Props {
  car: Car
}

export default function CarCard({ car }: Props) {
  const status = getStatus(car)
  const days = getDaysUntil(car.nextInspection)
  const statusStyle = STATUS_STYLES[status]
  const daysText = formatDaysLabel(days)

  return (
    <tr className={`border-b border-[#f1f3f4] align-top transition-colors hover:bg-[#f8f9fa] ${car.inactive ? 'opacity-55' : ''}`}>
      <td className="px-5 py-4">
        <p className="text-sm font-medium text-[#202124]">{car.name || '—'}</p>
        <p className="mt-1 text-xs font-mono text-[#9aa0a6]">{car.reg || '—'}</p>
        {car.companies.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {car.companies.map((company) => (
              <span key={company} className="inline-flex rounded-full bg-[#e8f0fe] px-2 py-1 text-[10px] font-medium text-[#1a73e8]">
                {abbrevCompany(company)}
              </span>
            ))}
            {car.sharedOwnership && (
              <span className="inline-flex rounded-full bg-[#fef7e0] px-2 py-1 text-[10px] font-medium text-[#b06000]">
                Delad
              </span>
            )}
          </div>
        )}
      </td>

      <td className="px-5 py-4 text-sm text-[#5f6368]">
        {formatDate(car.lastInspected)}
      </td>

      <td className="px-5 py-4">
        <p className="text-sm text-[#202124]">{formatDate(car.nextInspection)}</p>
        {daysText && <p className="mt-1 text-xs text-[#9aa0a6]">{daysText}</p>}
      </td>

      <td className="px-5 py-4">
        {car.inactive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f3f4] px-2.5 py-1 text-xs font-medium text-[#5f6368]">
            Avställd
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle.pill}`}>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </span>
        )}
      </td>
    </tr>
  )
}
