import { Car } from '@/lib/types'
import { getStatus, getDaysUntil, formatDate } from '@/lib/statusUtils'
import { abbrevCompany, formatDaysLabel, STATUS_STYLES } from '@/lib/carPresentation'

interface Props {
  car: Car
}

export default function MobileCarCard({ car }: Props) {
  const status = getStatus(car)
  const daysText = formatDaysLabel(getDaysUntil(car.nextInspection))
  const statusStyle = STATUS_STYLES[status]

  return (
    <article className={`rounded-2xl border border-[#dadce0] bg-white p-4 shadow-sm ${car.inactive ? 'opacity-60' : ''}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-[#202124]">{car.name || '—'}</h3>
            <p className="mt-1 text-xs font-mono uppercase tracking-[0.18em] text-[#5f6368]">{car.reg || '—'}</p>
          </div>

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
        </div>

        {car.companies.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#f8f9fa] px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">Senast</p>
          <p className="mt-1 text-sm text-[#202124]">{formatDate(car.lastInspected)}</p>
        </div>

        <div className="rounded-xl bg-[#f8f9fa] px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">Nästa</p>
          <p className="mt-1 text-sm text-[#202124]">{formatDate(car.nextInspection)}</p>
          {daysText && <p className="mt-1 text-xs text-[#9aa0a6]">{daysText}</p>}
        </div>
      </div>
    </article>
  )
}
