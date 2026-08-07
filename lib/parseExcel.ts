import * as XLSX from 'xlsx'
import { Car } from './types'
import { normalizeText } from './textUtils'

interface ParsedRow {
  name: string
  reg: string
  lastInspected: Date | null
  nextInspection: Date | null
  inactive: boolean
  companies: Set<string>
}

function datePartsToJS(year: number, month: number, day: number): Date | null {
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
  return new Date(Date.UTC(year, month - 1, day))
}

function excelDateToJS(val: unknown): Date | null {
  if (val instanceof Date) return val

  if (typeof val === 'number') {
    const parsed = XLSX.SSF.parse_date_code(val)
    if (parsed) return datePartsToJS(parsed.y, parsed.m, parsed.d)
    return new Date(Math.round((val - 25569) * 86400 * 1000))
  }

  if (typeof val === 'string' && val.trim()) {
    const trimmed = val.trim()
    const finDate = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed)
    if (finDate) {
      return datePartsToJS(Number(finDate[3]), Number(finDate[2]), Number(finDate[1]))
    }

    const d = new Date(trimmed)
    return isNaN(d.getTime()) ? null : d
  }

  return null
}

function findCol(headers: string[], keywords: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = normalizeText((headers[i] ?? '').toString()).toLowerCase()
    if (keywords.some((keyword) => header.includes(keyword))) return i
  }
  return -1
}

function cell(row: unknown[], index: number): string {
  if (index < 0) return ''
  return normalizeText((row[index] ?? '').toString()).trim()
}

// "Oravais Servicetrafik Ab. Slagfältsvägen 51, 66800 ORAVAIS" → "Oravais Servicetrafik Ab"
function extractCompany(ownerField: string): string {
  return ownerField.split('. ')[0].trim()
}

function cleanRegistration(value: string): string {
  return value.replace(/^="?/, '').replace(/"$/, '').trim()
}

function toCars(entries: ParsedRow[]): Car[] {
  const regMap = new Map<string, ParsedRow>()

  for (const entry of entries) {
    if (!entry.reg) continue

    const existing = regMap.get(entry.reg)
    if (existing) {
      if (!existing.name && entry.name) existing.name = entry.name
      if (entry.lastInspected) existing.lastInspected = entry.lastInspected
      if (entry.nextInspection) existing.nextInspection = entry.nextInspection
      Array.from(entry.companies).forEach((company) => existing.companies.add(company))
      if (!entry.inactive) existing.inactive = false
    } else {
      regMap.set(entry.reg, entry)
    }
  }

  return Array.from(regMap.values()).map((entry, i) => ({
    id: i + 1,
    name: entry.name || entry.reg,
    reg: entry.reg,
    lastInspected: entry.lastInspected,
    nextInspection: entry.nextInspection,
    inactive: entry.inactive,
    companies: Array.from(entry.companies).sort(),
    sharedOwnership: entry.companies.size > 1,
  }))
}

function parseVehicleRegisterRows(headers: string[], rows: unknown[][]): Car[] | null {
  const regCol = findCol(headers, ['registreringsnummer'])
  const statusCol = findCol(headers, ['fordonets status'])
  const makeCol = findCol(headers, ['märke', 'marke'])
  const modelCol = findCol(headers, ['handelsbeteckning'])
  const ownerCol = findCol(headers, ['ägare/innehavaren', 'agare/innehavaren', 'ägare', 'agare'])
  const lastCol = findCol(headers, ['besiktning början', 'besiktning borjan', 'periodisk besiktning början', 'periodisk besiktning borjan'])
  const nextCol = findCol(headers, ['besiktning slut', 'periodisk besiktning slut'])

  if (regCol === -1 || (makeCol === -1 && modelCol === -1) || nextCol === -1) return null

  const entries = rows.slice(1).map((row) => {
    const status = cell(row, statusCol).toLowerCase()
    const company = extractCompany(cell(row, ownerCol))

    return {
      name: [cell(row, makeCol), cell(row, modelCol)].filter(Boolean).join(' '),
      reg: cleanRegistration(cell(row, regCol)),
      lastInspected: excelDateToJS(row[lastCol]),
      nextInspection: excelDateToJS(row[nextCol]),
      inactive: status.includes('avställd'),
      companies: new Set(company ? [company] : []),
    }
  })

  return toCars(entries.filter((entry) => entry.reg || entry.name))
}

function parseGenericRows(headers: string[], rows: unknown[][]): Car[] {
  let nameCol = findCol(headers, ['vehicle', 'fordon', 'car', 'name', 'make', 'märke', 'marke', 'model'])
  let regCol = findCol(headers, ['registreringsnummer', 'reg', 'plate', 'rego', 'number'])
  let lastCol = findCol(headers, ['last', 'prev', 'previous', 'senast', 'besiktning början', 'besiktning borjan'])
  let nextCol = findCol(headers, ['next', 'due', 'upcoming', 'expir', 'nästa', 'nasta', 'besiktning slut'])

  if (nameCol === -1) nameCol = 0
  if (regCol === -1) regCol = 1
  if (lastCol === -1) lastCol = 2
  if (nextCol === -1) nextCol = 3

  const entries = rows.slice(1).map((row) => ({
    name: cell(row, nameCol),
    reg: cleanRegistration(cell(row, regCol)),
    lastInspected: excelDateToJS(row[lastCol]),
    nextInspection: excelDateToJS(row[nextCol]),
    inactive: false,
    companies: new Set<string>(),
  }))

  return toCars(entries.filter((entry) => entry.name || entry.reg))
}

export function parseExcel(file: File): Promise<Car[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', cellDates: false })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          raw: true,
          defval: null,
        }) as unknown[][]

        if (rows.length < 2) {
          resolve([])
          return
        }

        const headers = rows[0].map((header) => normalizeText((header ?? '').toString()))
        resolve(parseVehicleRegisterRows(headers, rows) ?? parseGenericRows(headers, rows))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
