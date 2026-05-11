import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import { normalizeText } from '@/lib/textUtils'

function datePartsToIso(year: number, month: number, day: number): string | null {
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
  return new Date(Date.UTC(year, month - 1, day)).toISOString()
}

function parseFinDate(val: unknown): string | null {
  if (!val) return null

  if (val instanceof Date) {
    return datePartsToIso(val.getUTCFullYear(), val.getUTCMonth() + 1, val.getUTCDate())
  }

  if (typeof val === 'number') {
    const parsed = XLSX.SSF.parse_date_code(val)
    if (!parsed) return null
    return datePartsToIso(parsed.y, parsed.m, parsed.d)
  }

  if (typeof val !== 'string') return null

  const parts = val.trim().split('.')
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)
  return datePartsToIso(year, month, day)
}

// "Oravais Servicetrafik Ab. Slagfältsvägen 51, 66800 ORAVAIS" → "Oravais Servicetrafik Ab"
function extractCompany(ownerField: string): string {
  return ownerField.split('. ')[0].trim()
}

function getSourceFiles(): string[] {
  const publicDir = path.join(process.cwd(), 'public')

  return fs.readdirSync(publicDir)
    .map((fileName) => {
      const match = /^ajoneuvot \((\d+)\)\.(csv|xlsx)$/i.exec(fileName)
      return match ? { fileName, index: Number(match[1]) } : null
    })
    .filter((file): file is { fileName: string; index: number } => file !== null)
    .sort((a, b) => a.index - b.index)
    .map(({ fileName }) => fileName)
}

interface RegEntry {
  name: string
  reg: string
  lastInspected: string | null
  nextInspection: string | null
  companies: Set<string>
  allInactive: boolean
}

export async function GET() {
  try {
    const regMap = new Map<string, RegEntry>()

    for (const fileName of getSourceFiles()) {
      const filePath = path.join(process.cwd(), 'public', fileName)
      if (!fs.existsSync(filePath)) continue

      const buf = fs.readFileSync(filePath)
      const wb = XLSX.read(buf, { type: 'buffer', raw: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        raw: true,
        defval: null,
      }) as (string | null)[][]

      for (const row of rows.slice(1)) {
        const rawReg = normalizeText((row[0] ?? '').toString())
        const reg = rawReg.replace(/^="?/, '').replace(/"$/, '').trim()
        if (!reg || !reg.includes('-')) continue

        const name = [row[3], row[4]]
          .filter(Boolean)
          .map((value) => normalizeText(String(value)))
          .join(' ')
        const status = normalizeText((row[1] ?? '').toString()).toLowerCase()
        const company = extractCompany(normalizeText((row[7] ?? '').toString()))
        const isInactive = status.includes('avställd')
        const last = parseFinDate(row[14])
        const next = parseFinDate(row[15])

        const existing = regMap.get(reg)
        if (existing) {
          if (company) existing.companies.add(company)
          if (last) existing.lastInspected = last
          if (next) existing.nextInspection = next
          if (!isInactive) existing.allInactive = false
        } else {
          regMap.set(reg, {
            name,
            reg,
            lastInspected: last,
            nextInspection: next,
            companies: new Set(company ? [company] : []),
            allInactive: isInactive,
          })
        }
      }
    }

    const cars = Array.from(regMap.values()).map((entry, i) => ({
      id: i + 1,
      name: entry.name,
      reg: entry.reg,
      lastInspected: entry.lastInspected,
      nextInspection: entry.nextInspection,
      inactive: entry.allInactive,
      companies: [...entry.companies].sort(),
      sharedOwnership: entry.companies.size > 1,
    }))

    return Response.json(cars)
  } catch {
    return Response.json({ error: 'Kunde inte läsa besiktningsfilen.' }, { status: 500 })
  }
}
