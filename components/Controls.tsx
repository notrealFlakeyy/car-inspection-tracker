import { FilterOption } from '@/lib/types'

interface Props {
  search: string
  filter: FilterOption
  companies: string[]
  companyFilter: string
  onSearch: (v: string) => void
  onFilter: (v: FilterOption) => void
  onCompanyFilter: (v: string) => void
}

interface FilterChip {
  value: FilterOption
  label: string
  activeClass: string
}

const FILTERS: FilterChip[] = [
  { value: 'all',      label: 'Alla',       activeClass: 'bg-[#e8eaed] text-[#202124] border-[#bdc1c6]' },
  { value: 'overdue',  label: 'Försenade',  activeClass: 'bg-[#fce8e6] text-[#d93025] border-[#f5c6c3]' },
  { value: 'soon',     label: 'Snart',      activeClass: 'bg-[#fef7e0] text-[#b06000] border-[#fce198]' },
  { value: 'ok',       label: 'Aktuella',   activeClass: 'bg-[#e6f4ea] text-[#137333] border-[#b7dfbf]' },
  { value: 'inactive', label: 'Avställda',  activeClass: 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]' },
]

const INACTIVE_CLASS = 'text-[#5f6368] border-[#dadce0] hover:bg-[#f1f3f4]'

export default function Controls({
  search, filter, companies, companyFilter,
  onSearch, onFilter, onCompanyFilter,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search + status chips row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Pill search input */}
        <div className="flex items-center gap-2 bg-white rounded-full border border-[#dadce0] px-4 py-2.5 flex-1 focus-within:border-[#1a73e8] focus-within:shadow-[0_0_0_3px_rgba(26,115,232,0.12)] transition-all">
          <svg className="h-4 w-4 text-[#5f6368] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input
            type="text"
            placeholder="Sök på fordon eller reg.nr…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-[#202124] placeholder-[#9aa0a6]"
          />
          {search && (
            <button onClick={() => onSearch('')} className="text-[#5f6368] hover:text-[#202124]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                filter === f.value ? f.activeClass : INACTIVE_CLASS
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Company chips row */}
      {companies.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#9aa0a6] shrink-0">Bolag</span>
          <button
            onClick={() => onCompanyFilter('')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              companyFilter === '' ? 'bg-[#e8f0fe] text-[#1a73e8] border-[#c5d8fc]' : INACTIVE_CLASS
            }`}
          >
            Alla
          </button>
          {companies.map((co) => (
            <button
              key={co}
              onClick={() => onCompanyFilter(companyFilter === co ? '' : co)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                companyFilter === co ? 'bg-[#e8f0fe] text-[#1a73e8] border-[#c5d8fc]' : INACTIVE_CLASS
              }`}
            >
              {co}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
