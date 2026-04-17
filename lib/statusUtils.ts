import { Car, Status, SortOption } from './types'

export function getDaysUntil(date: Date | null): number | null {
  if (!date) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function getStatus(car: Car): Status {
  const days = getDaysUntil(car.nextInspection)
  if (days === null) return 'unknown'
  if (days < 0) return 'overdue'
  if (days <= 30) return 'soon'
  return 'ok'
}

export function urgencyScore(car: Car): number {
  if (car.inactive) return 99999
  const days = getDaysUntil(car.nextInspection)
  if (days === null) return 9999
  if (days < 0) return days
  if (days <= 30) return 1000 + days
  return 2000 + days
}

export function sortCars(cars: Car[], sort: SortOption): Car[] {
  const copy = [...cars]
  switch (sort) {
    case 'urgency':
      return copy.sort((a, b) => urgencyScore(a) - urgencyScore(b))
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name))
    case 'next':
      return copy.sort((a, b) => {
        if (!a.nextInspection && !b.nextInspection) return 0
        if (!a.nextInspection) return 1
        if (!b.nextInspection) return -1
        return a.nextInspection.getTime() - b.nextInspection.getTime()
      })
    case 'last':
      return copy.sort((a, b) => {
        if (!a.lastInspected && !b.lastInspected) return 0
        if (!a.lastInspected) return 1
        if (!b.lastInspected) return -1
        return a.lastInspected.getTime() - b.lastInspected.getTime()
      })
  }
}

export function formatDate(date: Date | null): string {
  if (!date) return '—'
  return date.toLocaleDateString('sv-SE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
