'use client'

import { useState } from 'react'
import { Car, SortOption, FilterOption } from '@/lib/types'
import { getStatus, sortCars } from '@/lib/statusUtils'
import { parseExcel } from '@/lib/parseExcel'
import UploadZone from './UploadZone'
import MetricsRow from './MetricsRow'
import Controls from './Controls'
import CarCard from './CarCard'

function daysFromToday(n: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d
}

const SAMPLE_CARS: Car[] = [
  { id: 1, name: 'Ford Transit', reg: 'AB12 CDE', lastInspected: daysFromToday(-385), nextInspection: daysFromToday(-20) },
  { id: 2, name: 'Vauxhall Vivaro', reg: 'XY63 FGH', lastInspected: daysFromToday(-410), nextInspection: daysFromToday(-45) },
  { id: 3, name: 'Toyota Hilux', reg: 'LM19 JKL', lastInspected: daysFromToday(-350), nextInspection: daysFromToday(15) },
  { id: 4, name: 'Volkswagen Caddy', reg: 'PQ71 MNO', lastInspected: daysFromToday(-340), nextInspection: daysFromToday(22) },
  { id: 5, name: 'Land Rover Defender', reg: 'RS68 PQR', lastInspected: daysFromToday(-90), nextInspection: daysFromToday(275) },
  { id: 6, name: 'Nissan Navara', reg: 'TU21 STU', lastInspected: daysFromToday(-60), nextInspection: daysFromToday(305) },
  { id: 7, name: 'Mercedes Sprinter', reg: 'WX15 VWX', lastInspected: daysFromToday(-180), nextInspection: null },
]

export default function CarTracker() {
  const [cars, setCars] = useState<Car[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('urgency')
  const [filter, setFilter] = useState<FilterOption>('all')
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    try {
      const parsed = await parseExcel(file)
      setCars(parsed)
    } catch {
      setError('Failed to parse file. Please check the format and try again.')
    }
  }

  const filtered = sortCars(cars, sort).filter((car) => {
    const matchesSearch =
      car.name.toLowerCase().includes(search.toLowerCase()) ||
      car.reg.toLowerCase().includes(search.toLowerCase())
    const status = getStatus(car)
    const matchesFilter =
      filter === 'all' ||
      (filter === 'overdue' && status === 'overdue') ||
      (filter === 'soon' && status === 'soon') ||
      (filter === 'ok' && status === 'ok')
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Car inspection tracker</h1>
          <button
            onClick={() => { setCars(SAMPLE_CARS); setSearch(''); setSort('urgency'); setFilter('all') }}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            Load sample data
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* Upload zone */}
        <UploadZone onFile={handleFile} />

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">{error}</p>
        )}

        {cars.length > 0 && (
          <>
            <MetricsRow cars={cars} />
            <Controls
              search={search}
              sort={sort}
              filter={filter}
              onSearch={setSearch}
              onSort={setSort}
              onFilter={setFilter}
            />
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No vehicles match your filters.</p>
              ) : (
                filtered.map((car) => <CarCard key={car.id} car={car} />)
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
