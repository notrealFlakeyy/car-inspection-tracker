import * as XLSX from 'xlsx'
import { Car } from './types'
import { normalizeText } from './textUtils'

function excelDateToJS(val: unknown): Date | null {
  if (val instanceof Date) return val
  if (typeof val === 'number') {
    return new Date(Math.round((val - 25569) * 86400 * 1000))
  }
  if (typeof val === 'string' && val.trim()) {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

function findCol(headers: string[], keywords: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = (headers[i] ?? '').toString().toLowerCase()
    if (keywords.some((keyword) => header.includes(keyword))) return i
  }
  return -1
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

        let nameCol = findCol(headers, ['vehicle', 'car', 'name', 'make', 'model'])
        let regCol = findCol(headers, ['reg', 'plate', 'rego', 'number'])
        let lastCol = findCol(headers, ['last', 'prev', 'previous'])
        let nextCol = findCol(headers, ['next', 'due', 'upcoming', 'expir'])

        if (nameCol === -1) nameCol = 0
        if (regCol === -1) regCol = 1
        if (lastCol === -1) lastCol = 2
        if (nextCol === -1) nextCol = 3

        const cars: Car[] = rows.slice(1).map((row, i) => ({
          id: i + 1,
          name: normalizeText((row[nameCol] ?? '').toString()),
          reg: normalizeText((row[regCol] ?? '').toString()),
          lastInspected: excelDateToJS(row[lastCol]),
          nextInspection: excelDateToJS(row[nextCol]),
          inactive: false,
          companies: [],
          sharedOwnership: false,
        }))

        resolve(cars.filter((car) => car.name || car.reg))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
