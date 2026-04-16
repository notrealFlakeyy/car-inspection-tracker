'use client'

import { useState, useEffect, useMemo } from 'react'
import { Car, SortOption, FilterOption } from '@/lib/types'
import { getStatus, sortCars } from '@/lib/statusUtils'
import { parseExcel } from '@/lib/parseExcel'
import UploadZone from './UploadZone'
import MetricsRow from './MetricsRow'
import Controls from './Controls'
import CarCard from './CarCard'

function reviveDates(raw: unknown[]): Car[] {
  return (raw as Array<{
    id: number; name: string; reg: string
    lastInspected: string | null; nextInspection: string | null
    inactive: boolean; companies: string[]; sharedOwnership: boolean
  }>).map((c) => ({
    id: c.id,
    name: c.name,
    reg: c.reg,
    lastInspected: c.lastInspected ? new Date(c.lastInspected) : null,
    nextInspection: c.nextInspection ? new Date(c.nextInspection) : null,
    inactive: c.inactive ?? false,
    companies: c.companies ?? [],
    sharedOwnership: c.sharedOwnership ?? false,
  }))
}

function daysFromToday(n: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d
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
  { label: 'Fordon',            value: 'name' },
  { label: 'Senast besiktigad', value: 'last' },
  { label: 'Nästa besiktning',  value: 'next' },
  { label: 'Status',            value: 'urgency' },
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
    fetch('/api/cars')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCars(reviveDates(data))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const companies = useMemo(
    () => [...new Set(cars.flatMap((c) => c.companies))].sort(),
    [cars],
  )

  function handleSortClick(col: SortOption) {
    if (col === sort) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(col)
      setSortDir('asc')
    }
  }

  async function handleFile(file: File) {
    setError(null)
    try {
      const parsed = await parseExcel(file)
      setCars(parsed)
    } catch {
      setError('Kunde inte läsa filen. Kontrollera formatet och försök igen.')
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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f3f4]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#dadce0] border-t-[#1a73e8] animate-spin" />
          <p className="text-sm text-[#5f6368]">Hämtar fordon…</p>
        </div>
      </div>
    )
  }

  // ── Empty / upload ─────────────────────────────────────────────────────────
  if (cars.length === 0) {
    return (
      <div className="min-h-screen bg-[#f1f3f4] flex items-center justify-center px-4">
        {error && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-[#dadce0] rounded-2xl shadow-lg px-5 py-4 text-sm text-[#d93025] max-w-md w-full">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-[#dadce0] shadow-sm w-full max-w-md p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#e8f0fe] flex items-center justify-center">
              <CarIcon className="h-8 w-8 text-[#1a73e8]" />
            </div>
          </div>
          <h1 className="text-2xl font-medium text-[#202124]">Besiktningsöversikt</h1>
          <p className="mt-2 text-sm text-[#5f6368]">Importera dina fordon för att komma igång</p>

          <div className="mt-8">
            <UploadZone onFile={handleFile} />
          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#f1f3f4]" />
            <span className="text-xs text-[#9aa0a6]">eller</span>
            <div className="flex-1 h-px bg-[#f1f3f4]" />
          </div>

          <button
            onClick={() => { setCars(SAMPLE_CARS); setSearch(''); setSort('urgency'); setSortDir('asc'); setFilter('all'); setCompanyFilter('') }}
            className="w-full px-6 py-2.5 rounded-full border border-[#dadce0] text-sm font-medium text-[#1a73e8] hover:bg-[#f8f9fa] transition-colors"
          >
            Ladda exempeldata
          </button>
        </div>
      </div>
    )
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f1f3f4]">
      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#dadce0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1a73e8] flex items-center justify-center shadow-sm">
              <CarIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-medium text-[#202124] tracking-tight">Besiktningsöversikt</span>
          </div>

          <label className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-[#1a73e8] hover:bg-[#e8f0fe] cursor-pointer transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Ersätt fil
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileInput} />
          </label>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-5">
        {error && (
          <div className="flex items-center gap-3 bg-white border border-[#dadce0] rounded-2xl px-5 py-4 text-sm text-[#d93025]">
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
          onSearch={setSearch}
          onFilter={setFilter}
          onCompanyFilter={setCompanyFilter}
        />

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-[#dadce0] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f1f3f4]">
                {SORT_COLS.map((col) => (
                  <th
                    key={col.value}
                    onClick={() => handleSortClick(col.value)}
                    className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:bg-[#f8f9fa] ${
                      sort === col.value ? 'text-[#1a73e8]' : 'text-[#5f6368]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <svg
                        className={`h-3 w-3 transition-opacity ${sort === col.value ? 'opacity-100' : 'opacity-0'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                          d={sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                      </svg>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-sm text-[#9aa0a6]">
                    Inga fordon matchar filtren.
                  </td>
                </tr>
              ) : (
                filtered.map((car) => <CarCard key={car.id} car={car} />)
              )}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-[#f1f3f4] text-xs text-[#9aa0a6]">
              {filtered.length} av {cars.length} fordon
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
