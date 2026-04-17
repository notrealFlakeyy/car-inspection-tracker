'use client'

import { useEffect, useMemo, useState } from 'react'
import { Car, FilterOption, SortOption } from '@/lib/types'
import { getStatus, sortCars } from '@/lib/statusUtils'
import { parseExcel } from '@/lib/parseExcel'
import UploadZone from './UploadZone'
import MetricsRow from './MetricsRow'
import Controls from './Controls'
import CarCard from './CarCard'
import MobileCarCard from './MobileCarCard'

function reviveDates(raw: unknown[]): Car[] {
  return (raw as Array<{
    id: number; name: string; reg: string
    lastInspected: string | null; nextInspection: string | null
    inactive: boolean; companies: string[]; sharedOwnership: boolean
  }>).map((car) => ({
    id: car.id,
    name: car.name,
    reg: car.reg,
    lastInspected: car.lastInspected ? new Date(car.lastInspected) : null,
    nextInspection: car.nextInspection ? new Date(car.nextInspection) : null,
    inactive: car.inactive ?? false,
    companies: car.companies ?? [],
    sharedOwnership: car.sharedOwnership ?? false,
  }))
}

function daysFromToday(n: number): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + n)
  return date
}

const SAMPLE_CARS: Car[] = [
  { id: 1, name: 'Ford Transit', reg: 'AB12 CDE', lastInspected: daysFromToday(-385), nextInspection: daysFromToday(-20), inactive: false, companies: ['Exempelbolag Ab'], sharedOwnership: false },
  { id: 2, name: 'Vauxhall Vivaro', reg: 'XY63 FGH', lastInspected: daysFromToday(-410), nextInspection: daysFromToday(-45), inactive: false, companies: ['Exempelbolag Ab'], sharedOwnership: false },
  { id: 3, name: 'Toyota Hilux', reg: 'LM19 JKL', lastInspected: daysFromToday(-350), nextInspection: daysFromToday(15), inactive: false, companies: ['Exempelbolag Ab'], sharedOwnership: false },
  { id: 4, name: 'Volkswagen Caddy', reg: 'PQ71 MNO', lastInspected: daysFromToday(-340), nextInspection: daysFromToday(22), inactive: false, companies: ['Exempelbolag Ab', 'Annat Bolag Oy'], sharedOwnership: true },
  { id: 5, name: 'Land Rover Defender', reg: 'RS68 PQR', lastInspected: daysFromToday(-90), nextInspection: daysFromToday(275), inactive: false, companies: ['Annat Bolag Oy'], sharedOwnership: false },
  { id: 6, name: 'Nissan Navara', reg: 'TU21 STU', lastInspected: daysFromToday(-60), nextInspection: daysFromToday(305), inactive: false, companies: ['Annat Bolag Oy'], sharedOwnership: false },
  { id: 7, name: 'Mercedes Sprinter', reg: 'WX15 VWX', lastInspected: daysFromToday(-180), nextInspection: null, inactive: true, companies: ['Exempelbolag Ab'], sharedOwnership: false },
]

const SORT_COLS: { label: string; value: SortOption }[] = [
  { label: 'Fordon', value: 'name' },
  { label: 'Senast besiktigad', value: 'last' },
  { label: 'N\u00E4sta besiktning', value: 'next' },
  { label: 'Status', value: 'urgency' },
]

const CarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
)

export default function CarTracker() {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('urgency')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filter, setFilter] = useState<FilterOption>('all')
  const [companyFilter, setCompanyFilter] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    fetch('/api/cars')
      .then((res) => {
        if (!res.ok) throw new Error('load-failed')
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        if (Array.isArray(data)) {
          setCars(reviveDates(data))
        } else {
          setError('Kunde inte h\u00E4mta fordonslistan.')
        }
        setLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setError('Kunde inte h\u00E4mta fordonslistan.')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const companies = useMemo(
    () => [...new Set(cars.flatMap((car) => car.companies))].sort(),
    [cars],
  )

  useEffect(() => {
    if (companyFilter && !companies.includes(companyFilter)) {
      setCompanyFilter('')
    }
  }, [companies, companyFilter])

  function handleSortClick(col: SortOption) {
    if (col === sort) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(col)
      setSortDir('asc')
    }
  }

  function resetViewState() {
    setSearch('')
    setSort('urgency')
    setSortDir('asc')
    setFilter('all')
    setCompanyFilter('')
  }

  async function handleFile(file: File) {
    setError(null)
    try {
      const parsed = await parseExcel(file)
      resetViewState()
      setCars(parsed)
    } catch {
      setError('Kunde inte l\u00E4sa filen. Kontrollera formatet och f\u00F6rs\u00F6k igen.')
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.currentTarget.value = ''
  }

  const filtered = (() => {
    const sorted = sortCars(cars, sort)
    const directed = sortDir === 'desc' ? [...sorted].reverse() : sorted
    return directed.filter((car) => {
      const matchesSearch =
        car.name.toLowerCase().includes(search.toLowerCase()) ||
        car.reg.toLowerCase().includes(search.toLowerCase())
      const status = getStatus(car)
      const matchesFilter =
        filter === 'all' ||
        (filter === 'inactive' && car.inactive) ||
        (filter === 'overdue' && !car.inactive && status === 'overdue') ||
        (filter === 'soon' && !car.inactive && status === 'soon') ||
        (filter === 'ok' && !car.inactive && status === 'ok')
      const matchesCompany =
        companyFilter === '' || car.companies.includes(companyFilter)

      return matchesSearch && matchesFilter && matchesCompany
    })
  })()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f3f4] px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#dadce0] border-t-[#1a73e8]" />
          <p className="text-sm text-[#5f6368]">H\u00E4mtar fordon...</p>
        </div>
      </div>
    )
  }

  if (cars.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f3f4] px-4 py-8 sm:py-10">
        {error && (
          <div className="fixed left-4 right-4 top-4 z-50 flex items-center gap-3 rounded-2xl border border-[#dadce0] bg-white px-4 py-4 text-sm text-[#d93025] shadow-lg sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:px-5">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="w-full max-w-md rounded-3xl border border-[#dadce0] bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f0fe]">
              <CarIcon className="h-8 w-8 text-[#1a73e8]" />
            </div>
          </div>
          <h1 className="text-2xl font-medium text-[#202124]">Besiktnings\u00F6versikt</h1>
          <p className="mt-2 text-sm text-[#5f6368]">Importera dina fordon f\u00F6r att komma ig\u00E5ng</p>

          <div className="mt-8">
            <UploadZone onFile={handleFile} />
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#f1f3f4]" />
            <span className="text-xs text-[#9aa0a6]">eller</span>
            <div className="h-px flex-1 bg-[#f1f3f4]" />
          </div>

          <button
            type="button"
            onClick={() => {
              resetViewState()
              setCars(SAMPLE_CARS)
            }}
            className="w-full rounded-full border border-[#dadce0] px-6 py-3 text-sm font-medium text-[#1a73e8] transition-colors hover:bg-[#f8f9fa]"
          >
            Ladda exempeldata
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f3f4]">
      <header className="sticky top-0 z-20 border-b border-[#dadce0] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:py-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a73e8] shadow-sm">
              <CarIcon className="h-5 w-5 text-white" />
            </div>
            <span className="truncate text-base font-medium tracking-tight text-[#202124] sm:text-lg">
              Besiktnings\u00F6versikt
            </span>
          </div>

          <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-[#1a73e8] transition-colors hover:bg-[#e8f0fe] sm:w-auto sm:rounded-full">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Ers\u00E4tt fil
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileInput} />
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:space-y-5 sm:px-6 sm:py-8">
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-[#dadce0] bg-white px-4 py-4 text-sm text-[#d93025] sm:px-5">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <MetricsRow cars={cars} />

        <Controls
          search={search}
          filter={filter}
          companies={companies}
          companyFilter={companyFilter}
          sort={sort}
          sortDir={sortDir}
          onSearch={setSearch}
          onFilter={setFilter}
          onCompanyFilter={setCompanyFilter}
          onSort={setSort}
          onSortDir={setSortDir}
        />

        <div className="space-y-3 lg:hidden">
          {filtered.length > 0 && filtered.map((car) => <MobileCarCard key={car.id} car={car} />)}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-[#dadce0] bg-white px-5 py-10 text-center text-sm text-[#9aa0a6]">
              Inga fordon matchar filtren.
            </div>
          )}

          {filtered.length > 0 && (
            <div className="rounded-2xl border border-[#dadce0] bg-white px-4 py-3 text-center text-xs text-[#9aa0a6]">
              {filtered.length} av {cars.length} fordon
            </div>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-[#dadce0] bg-white lg:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f1f3f4]">
                {SORT_COLS.map((col) => (
                  <th key={col.value} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#5f6368]">
                    <button
                      type="button"
                      onClick={() => handleSortClick(col.value)}
                      className={`inline-flex items-center gap-1 rounded-md transition-colors hover:text-[#1a73e8] ${
                        sort === col.value ? 'text-[#1a73e8]' : 'text-[#5f6368]'
                      }`}
                    >
                      {col.label}
                      <svg
                        className={`h-3 w-3 transition-opacity ${sort === col.value ? 'opacity-100' : 'opacity-0'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d={sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
                        />
                      </svg>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={SORT_COLS.length} className="py-16 text-center text-sm text-[#9aa0a6]">
                    Inga fordon matchar filtren.
                  </td>
                </tr>
              ) : (
                filtered.map((car) => <CarCard key={car.id} car={car} />)
              )}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="border-t border-[#f1f3f4] px-5 py-3 text-xs text-[#9aa0a6]">
              {filtered.length} av {cars.length} fordon
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
