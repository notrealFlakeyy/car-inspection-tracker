import { FilterOption, SortOption } from '@/lib/types'

interface Props {
  search: string
  filter: FilterOption
  companies: string[]
  companyFilter: string
  sort: SortOption
  sortDir: 'asc' | 'desc'
  onSearch: (v: string) => void
  onFilter: (v: FilterOption) => void
  onCompanyFilter: (v: string) => void
  onSort: (v: SortOption) => void
  onSortDir: (v: 'asc' | 'desc') => void
}

interface FilterChip {
  value: FilterOption
  label: string
  activeClass: string
}

const FILTERS: FilterChip[] = [
  { value: 'all', label: 'Alla', activeClass: 'bg-[#e8eaed] text-[#202124] border-[#bdc1c6]' },
  { value: 'overdue', label: 'Försenade', activeClass: 'bg-[#fce8e6] text-[#d93025] border-[#f5c6c3]' },
  { value: 'soon', label: 'Snart', activeClass: 'bg-[#fef7e0] text-[#b06000] border-[#fce198]' },
  { value: 'ok', label: 'Aktuella', activeClass: 'bg-[#e6f4ea] text-[#137333] border-[#b7dfbf]' },
  { value: 'inactive', label: 'Avställda', activeClass: 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]' },
]

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Status', value: 'urgency' },
  { label: 'Fordon', value: 'name' },
  { label: 'Nästa besiktning', value: 'next' },
  { label: 'Senast besiktigad', value: 'last' },
]

const INACTIVE_CLASS = 'text-[#5f6368] border-[#dadce0] hover:bg-[#f1f3f4]'

export default function Controls({
  search,
  filter,
  companies,
  companyFilter,
  sort,
  sortDir,
  onSearch,
  onFilter,
  onCompanyFilter,
  onSort,
  onSortDir,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-2 rounded-full border border-[#dadce0] bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-[#1a73e8] focus-within:shadow-[0_0_0_3px_rgba(26,115,232,0.12)] lg:flex-1">
          <svg className="h-4 w-4 shrink-0 text-[#5f6368]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input
            type="text"
            placeholder="Sök på fordon eller reg.nr..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#202124] outline-none placeholder-[#9aa0a6]"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              className="text-[#5f6368] transition-colors hover:text-[#202124]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
          {FILTERS.map((statusFilter) => (
            <button
              type="button"
              key={statusFilter.value}
              onClick={() => onFilter(statusFilter.value)}
              aria-pressed={filter === statusFilter.value}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                filter === statusFilter.value ? statusFilter.activeClass : INACTIVE_CLASS
              }`}
            >
              {statusFilter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
        {companies.length > 0 && (
          <div className="rounded-2xl border border-[#dadce0] bg-white px-4 py-3 shadow-sm xl:flex-1">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5f6368]">Bolag</span>
              {companyFilter && (
                <button
                  type="button"
                  onClick={() => onCompanyFilter('')}
                  className="text-xs font-medium text-[#1a73e8] transition-colors hover:text-[#1557b0]"
                >
                  Rensa
                </button>
              )}
            </div>

            <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              <button
                type="button"
                onClick={() => onCompanyFilter('')}
                aria-pressed={companyFilter === ''}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  companyFilter === '' ? 'bg-[#e8f0fe] text-[#1a73e8] border-[#c5d8fc]' : INACTIVE_CLASS
                }`}
              >
                Alla
              </button>
              {companies.map((company) => (
                <button
                  type="button"
                  key={company}
                  onClick={() => onCompanyFilter(companyFilter === company ? '' : company)}
                  aria-pressed={companyFilter === company}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    companyFilter === company ? 'bg-[#e8f0fe] text-[#1a73e8] border-[#c5d8fc]' : INACTIVE_CLASS
                  }`}
                >
                  {company}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:w-[24rem]">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5f6368]">Sortera</span>
            <select
              value={sort}
              onChange={(e) => onSort(e.target.value as SortOption)}
              className="rounded-2xl border border-[#dadce0] bg-white px-4 py-3 text-sm text-[#202124] shadow-sm outline-none transition-colors focus:border-[#1a73e8]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5f6368]">Ordning</span>
            <button
              type="button"
              onClick={() => onSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dadce0] bg-white px-4 py-3 text-sm font-medium text-[#202124] shadow-sm transition-colors hover:bg-[#f8f9fa]"
            >
              <svg className="h-4 w-4 text-[#1a73e8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={sortDir === 'asc' ? 'M8 15l4-4 4 4' : 'M16 9l-4 4-4-4'}
                />
              </svg>
              {sortDir === 'asc' ? 'Stigande' : 'Fallande'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
