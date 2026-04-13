import { SortOption, FilterOption } from '@/lib/types'

interface Props {
  search: string
  sort: SortOption
  filter: FilterOption
  onSearch: (v: string) => void
  onSort: (v: SortOption) => void
  onFilter: (v: FilterOption) => void
}

export default function Controls({ search, sort, filter, onSearch, onSort, onFilter }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="text"
        placeholder="Search by vehicle or registration…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <select
        value={sort}
        onChange={(e) => onSort(e.target.value as SortOption)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="urgency">Sort by urgency</option>
        <option value="name">Sort by name</option>
        <option value="next">Sort by next inspection</option>
        <option value="last">Sort by last inspected</option>
      </select>
      <select
        value={filter}
        onChange={(e) => onFilter(e.target.value as FilterOption)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="all">All statuses</option>
        <option value="overdue">Overdue</option>
        <option value="soon">Due soon</option>
        <option value="ok">Up to date</option>
      </select>
    </div>
  )
}
