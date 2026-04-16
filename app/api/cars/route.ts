import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'

function parseFinDate(val: unknown): string | null {
  if (!val || typeof val !== 'string') return null
  const parts = val.trim().split('.')
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null
  return new Date(Date.UTC(year, month - 1, day)).toISOString()
}

// "Oravais Servicetrafik Ab. Slagfältsvägen 51, 66800 ORAVAIS" → "Oravais Servicetrafik Ab"
function extractCompany(ownerField: string): string {
  return ownerField.split('. ')[0].trim()
}

interface RegEntry {
  name: string
  reg: string
  lastInspected: string | null
  nextInspection: string | null
  companies: Set<string>
  allInactive: boolean
}

const CSV_FILES = [
  'ajoneuvot (2).csv',
  'ajoneuvot (3).csv',
  'ajoneuvot (4).csv',
  'ajoneuvot (5).csv',
]

export async function GET() {
  try {
    const regMap = new Map<string, RegEntry>()

    for (const fileName of CSV_FILES) {
      const filePath = path.join(process.cwd(), 'public', fileName)
      if (!fs.existsSync(filePath)) continue

      const buf = fs.readFileSync(filePath)
      // raw:true keeps registration numbers as ="XXX-999" strings rather than formula results
      const wb = XLSX.read(buf, { type: 'buffer', raw: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, {
        header: 1, raw: true, defval: null,
      }) as (string | null)[][]

      for (const r of rows.slice(1)) {
        // Strip Excel text-coercion wrapper: ="XXX-999" → XXX-999
        const rawReg = (r[0] ?? '').toString()
        const reg = rawReg.replace(/^="?/, '').replace(/"$/, '').trim()
        if (!reg || !reg.includes('-')) continue

        const name = [r[3], r[4]].filter(Boolean).join(' ')
        const company = extractCompany((r[7] ?? '').toString())
        const isInactive = (r[1] ?? '').toString().includes('avställd')
        const last = parseFinDate(r[14])
        const next = parseFinDate(r[15])

        const existing = regMap.get(reg)
        if (existing) {
          if (company) existing.companies.add(company)
          // Prefer rows that have more inspection data
          if (!existing.lastInspected && last) existing.lastInspected = last
          if (!existing.nextInspection && next) existing.nextInspection = next
          // Active if any source says it's registered
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
