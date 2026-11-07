// Run from the repository root: node docs/performance-audit.mjs
// Synthetic CPU experiment; no database, network, or application files are modified.
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
function setup(reuseFormatter) {
  const modules = new Map()
  function load(name) {
    if (modules.has(name)) return modules.get(name)
    let source = fs.readFileSync(path.join(root, 'lib', `${name}.ts`), 'utf8')
    if (!reuseFormatter && name === 'agenda') {
      const current = 'return dayFmt.format(now)'
      assert.ok(source.includes(current), 'todayISO changed; update this experiment')
      source = source.replace(current, "return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now)")
    }
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    })
    const mod = { exports: {} }
    new Function('exports', 'require', outputText)(mod.exports, (p) => load(p.replace('./', '')))
    modules.set(name, mod.exports)
    return mod.exports
  }
  return { agenda: load('agenda'), slots: load('free-slots') }
}

let originalResults
for (const reuseFormatter of [false, true]) {
  const { agenda: a, slots: f } = setup(reuseFormatter)
  const today = '2026-11-07'
  const now = new Date('2026-11-07T09:00:00-03:00')
  const busy = Array.from({ length: 61 * 3 }, (_, i) => {
    const day = a.addDays(today, Math.floor(i / 3))
    const hour = 7 + i % 3
    const time = (h, minutes) => `${String(h).padStart(2, '0')}:${minutes}`
    return {
      id: String(i), kind: 'appointment', time_known: true,
      starts_at: a.toTimestamp(day, time(hour, '00')),
      ends_at: a.toTimestamp(day, time(hour + 1, '00')),
      blocked_until: a.toTimestamp(day, time(hour + 1, '15')),
    }
  })
  const chips = Array.from({ length: 14 }, (_, i) => a.addDays(today, i))
  const itemsOf = (d) => busy.filter((item) => a.dayOf(item.starts_at) === d)
  const slotsOf = (d) => f.freeSlots({ day: d, busy: itemsOf(d), duration: 60, buffer: 15, now })
  function calculate() {
    itemsOf(today)
    const selected = slotsOf(today)
    const next = chips.find((d) => d > today && slotsOf(d).length > 0)
    const days = chips.map((d) => {
      const items = itemsOf(d)
      f.busyMinutes(d, items.filter((item) => item.kind === 'block'))
      return slotsOf(d)
    })
    return { selected, next, days }
  }
  const samplesMs = []
  let result
  for (let sample = 0; sample < 3; sample++) {
    const start = performance.now()
    result = calculate()
    samplesMs.push(Math.round(performance.now() - start))
  }
  if (!reuseFormatter) originalResults = result
  else assert.deepEqual(result, originalResults)
  console.log(JSON.stringify({ reuseFormatter, busyItems: busy.length, samplesMs,
    medianMs: [...samplesMs].sort((x, y) => x - y)[1], sameResults: reuseFormatter ? true : undefined }))
}
