import { Status } from './types'

interface StatusStyle {
  pill: string
  dot: string
  label: string
}

export const STATUS_STYLES: Record<Status, StatusStyle> = {
  overdue: {
    pill: 'bg-[#fce8e6] text-[#d93025]',
    dot: 'bg-[#d93025]',
    label: 'F\u00F6rsenad',
  },
  soon: {
    pill: 'bg-[#fef7e0] text-[#b06000]',
    dot: 'bg-[#f9ab00]',
    label: 'Snart f\u00F6rfallen',
  },
  ok: {
    pill: 'bg-[#e6f4ea] text-[#137333]',
    dot: 'bg-[#34a853]',
    label: 'Aktuell',
  },
  unknown: {
    pill: 'bg-[#f1f3f4] text-[#5f6368]',
    dot: 'bg-[#9aa0a6]',
    label: 'Inget datum',
  },
}

export function abbrevCompany(name: string): string {
  const words = name.split(' ')
  if (words[0] === 'Budtrans') return `BT ${words[1] ?? ''}`.trim()
  return words[0] ?? name
}

export function formatDaysLabel(days: number | null): string {
  if (days === null) return ''
  return days < 0 ? `${Math.abs(days)} dagar f\u00F6rsenad` : `${days} dagar kvar`
}
