export interface Car {
  id: number
  name: string
  reg: string
  lastInspected: Date | null
  nextInspection: Date | null
}

export type Status = 'overdue' | 'soon' | 'ok' | 'unknown'
export type SortOption = 'urgency' | 'name' | 'next' | 'last'
export type FilterOption = 'all' | 'overdue' | 'soon' | 'ok'
