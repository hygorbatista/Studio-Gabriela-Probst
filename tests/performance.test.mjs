import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { loadSource } from './load-source.mjs'

const a = loadSource('lib/agenda.ts')
const f = loadSource('lib/free-slots.ts')
const { dueClients } = loadSource('lib/return-due.ts')
const { clientContext } = loadSource('lib/client-list.ts')
const day = '2026-11-07'
const now = new Date('2026-11-07T09:00:00-03:00')
const service = { id: 'service', name: 'Gel', return_days: 21 }
function visit(date, status = 'completed') {
  return { starts_at: date, status, services: service, appointment_services: [] }
}
function api(entry, respond) {
  const requests = []
  const supabase = createClient('https://performance-test.invalid', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => {
      const url = new URL(input)
      requests.push(url)
      return new Response(JSON.stringify(respond(url)), { headers: { 'Content-Type': 'application/json' } })
    } },
  })
  return { requests, data: loadSource(entry, { '@/lib/auth': { requireUser: async () => ({ supabase }) } }) }
}

test('Brasilia date boundaries and year rollover remain correct', () => {
  assert.equal(a.todayISO(new Date('2026-11-07T02:59:59Z')), '2026-11-06')
  assert.equal(a.todayISO(new Date('2026-11-07T03:00:00Z')), day)
  assert.equal(a.dayOf('2027-01-01T02:30:00Z'), '2026-12-31')
  assert.equal(a.dayOf('2027-01-01T00:30:00-03:00'), '2027-01-01')
})

test('grouping preserves slots, conflicts, blocks and unknown-time visits', () => {
  const busy = [
    { id: 'own', starts_at: a.toTimestamp(day, '09:00'), ends_at: a.toTimestamp(day, '10:00'), blocked_until: a.toTimestamp(day, '10:15'), time_known: true, kind: 'appointment' },
    { id: 'block', starts_at: a.toTimestamp(day, '13:00'), ends_at: a.toTimestamp(day, '15:00'), blocked_until: a.toTimestamp(day, '15:00'), time_known: true, kind: 'block' },
    { id: 'unknown', starts_at: a.toTimestamp(day, '12:00'), ends_at: a.toTimestamp(day, '13:00'), blocked_until: a.toTimestamp(day, '13:15'), time_known: false, kind: 'appointment' },
    { id: 'previous', starts_at: '2026-11-07T02:00:00Z', ends_at: '2026-11-07T02:30:00Z', blocked_until: '2026-11-07T02:45:00Z', time_known: true, kind: 'appointment' },
  ]
  for (const excludeId of [undefined, 'own']) {
    const filtered = busy.filter((item) => item.id !== excludeId)
    const grouped = a.groupByDay(filtered)
    for (const target of ['2026-11-06', day, '2026-11-08', '2027-02-10']) {
      const legacy = filtered.filter((item) => a.dayOf(item.starts_at) === target)
      assert.deepEqual(grouped.get(target) ?? [], legacy)
      for (const duration of [40, 60, 150, 240]) {
        const options = { day: target, duration, buffer: 15, now }
        assert.deepEqual(
          f.freeSlots({ ...options, busy: (grouped.get(target) ?? []).filter((item) => item.time_known) }),
          f.freeSlots({ ...options, busy: legacy.filter((item) => item.time_known) }),
        )
      }
    }
  }
})

test('two-visit projection preserves return invitations and client context', () => {
  const histories = [
    [visit('2026-09-01T12:00:00Z'), visit('2026-10-10T12:00:00Z')],
    [visit('2026-10-01T12:00:00Z'), visit('2026-11-20T12:00:00Z', 'scheduled')],
    [visit('2026-09-01T12:00:00Z'), visit('2026-11-01T12:00:00Z', 'scheduled')],
    [visit('2026-10-01T12:00:00Z'), visit('2026-11-03T12:00:00Z', 'cancelled'), visit('2026-11-05T12:00:00Z', 'no_show')],
    [visit('2026-10-01T12:00:00Z'), visit('2026-11-20T12:00:00Z')],
    [],
  ]
  for (const appointments of histories) {
    const client = { id: 'client', name: 'Test', phone: null, appointments }
    const latest = appointments.filter((v) => ['scheduled', 'completed'].includes(v.status)).sort((x, y) => y.starts_at.localeCompare(x.starts_at)).slice(0, 1)
    const upcoming = appointments.filter((v) => v.status === 'scheduled' && new Date(v.starts_at) >= now).sort((x, y) => x.starts_at.localeCompare(y.starts_at)).slice(0, 1)
    assert.deepEqual(dueClients([{ ...client, appointments: [...latest, ...upcoming] }], 60, now), dueClients([client], 60, now))
    const lastDone = appointments.filter((v) => v.status === 'completed').sort((x, y) => y.starts_at.localeCompare(x.starts_at)).slice(0, 1)
    assert.deepEqual(clientContext([...upcoming, ...lastDone], now), clientContext(appointments, now))
  }
})

test('weekly agenda uses two queries and retains cancelled/no-show rows in the day', async () => {
  const rows = ['scheduled', 'completed', 'cancelled', 'no_show'].map((status, i) => ({
    id: String(i), starts_at: a.toTimestamp(day, `${10 + i}:00`), ends_at: a.toTimestamp(day, `${11 + i}:00`),
    blocked_until: a.toTimestamp(day, `${11 + i}:15`), time_known: i !== 1, status, confirmed_at: null,
    price_charged: 50, services_label: null, clients: { name: 'Test' }, services: { name: 'Gel' },
  }))
  const { data, requests } = api('app/painel/agenda/data.ts', (url) => url.pathname.endsWith('/appointments') ? rows : [])
  const result = await data.getDayAgenda(day, a.weekStart(day))
  assert.equal(requests.length, 2)
  assert.deepEqual(result.appointments.map((v) => v.status), ['scheduled', 'completed', 'cancelled', 'no_show'])
  assert.equal(result.week.get(day).count, 2)
  assert.equal(result.week.get(day).minutes, 60)
  const query = requests.find((url) => url.pathname.endsWith('/appointments')).searchParams
  assert.equal(query.get('starts_at'), 'gte.' + a.dayRange(a.weekStart(day)).start)
  assert.equal(query.getAll('starts_at')[1], 'lt.' + a.dayRange(a.addDays(a.weekStart(day), 6)).end)
})

test('client query paginates without loading full history', async () => {
  const rows = Array.from({ length: 41 }, (_, i) => ({ id: String(i), name: `Client ${i}`, phone: null, upcoming: [], last_visit: [] }))
  const { data, requests } = api('app/painel/clientes/data.ts', () => rows)
  const result = await data.searchClients('123', 2)
  assert.equal(result.clients.length, 40)
  assert.equal(result.hasMore, true)
  const query = requests[0].searchParams
  assert.equal(query.get('offset'), '40')
  assert.equal(query.get('limit'), '41')
  assert.equal(query.get('upcoming.limit'), '1')
  assert.equal(query.get('last_visit.limit'), '1')
  assert.equal(query.get('upcoming.status'), 'eq.scheduled')
  assert.equal(query.get('last_visit.status'), 'eq.completed')
  assert.equal(query.get('order'), 'name.asc,id.asc')
  assert.ok(query.get('or').includes('phone.ilike.%123%'))
})

test('return query bounds both histories and preserves a pending past visit', async () => {
  const last = visit(new Date(Date.now() - 40 * 86400000).toISOString(), 'scheduled')
  const { data, requests } = api('app/painel/agenda/data.ts', (url) => url.pathname.endsWith('/settings')
    ? { inactive_days_threshold: 60 }
    : [{ id: 'client', name: 'Test', phone: null, last_visit: [last], upcoming: [] }])
  const result = await data.getReturnList()
  assert.equal(result.length, 1)
  const query = requests.find((url) => url.pathname.endsWith('/clients')).searchParams
  assert.equal(query.get('last_visit.limit'), '1')
  assert.equal(query.get('upcoming.limit'), '1')
  assert.equal(query.get('last_visit.order'), 'starts_at.desc')
  assert.ok(query.get('select').includes('last_visit:appointments!inner'))
})

test('free-time service options do not fetch clients; habits filter selected client', async () => {
  const { data, requests } = api('app/painel/agenda/data.ts', () => [])
  await data.getServiceOptions()
  assert.equal(requests.length, 1)
  assert.ok(requests[0].pathname.endsWith('/services'))
  await data.getClientHabits('selected-client')
  assert.equal(requests[1].searchParams.get('client_id'), 'eq.selected-client')
})

test('client detail and timeline are bounded independently of summary statistics', async () => {
  const rows = Array.from({ length: 21 }, (_, i) => ({
    id: String(i), starts_at: '2026-10-01T12:00:00Z', time_known: true, status: 'completed',
    price_charged: 50, services_label: null, services: { name: 'Gel' },
  }))
  const { data, requests } = api('app/painel/clientes/data.ts', (url) => url.pathname.endsWith('/clients')
    ? { id: 'client', name: 'Test', phone: null, birth_date: null, preferences: null }
    : rows)
  const client = await data.getClient('client')
  assert.equal(client.name, 'Test')
  assert.equal(requests[0].searchParams.get('select'), '*')
  const result = await data.getClientHistory('client', 2)
  assert.equal(result.appointments.length, 20)
  assert.equal(result.hasMore, true)
  assert.equal(requests[1].searchParams.get('client_id'), 'eq.client')
  assert.equal(requests[1].searchParams.get('offset'), '20')
  assert.equal(requests[1].searchParams.get('limit'), '21')
})

test('client statistics load the complete summary in one RPC', async () => {
  const summary = {
    visits: 501, totalSpent: 25050, averageTicket: 50,
    lastVisit: '2026-10-01T12:00:00Z', nextVisit: '2026-11-08T12:00:00Z',
    favoriteService: 'Gel', favoriteTime: 'Quintas, por volta das 9h',
  }
  const { data, requests } = api('app/painel/clientes/data.ts', (url) => {
    assert.equal(url.pathname, '/rest/v1/rpc/client_statistics')
    return summary
  })
  assert.deepEqual(await data.getClientStats('client'), summary)
  assert.equal(requests.length, 1)
})

test('monthly expense total uses the same date filters as the list and reads only amounts', async () => {
  const { data, requests } = api('app/painel/despesas/data.ts', (url) =>
    url.pathname.endsWith('/recurring_expenses') ? [{ amount: 100 }] : [{ amount: 25 }, { amount: 50 }])

  assert.equal(await data.getMonthExpenseTotal('2026-12'), 175)
  assert.equal((await data.getMonthExpenses('2026-12')).total, 175)
  assert.equal(requests.length, 4)
  const recurring = requests.filter((url) => url.pathname.endsWith('/recurring_expenses'))
  const oneOff = requests.filter((url) => url.pathname.endsWith('/expenses'))
  for (const url of recurring) {
    assert.equal(url.searchParams.get('starts_on'), 'lte.2026-12-01')
    assert.equal(url.searchParams.get('or'), '(ends_on.is.null,ends_on.gte.2026-12-01)')
  }
  for (const url of oneOff) {
    assert.deepEqual(url.searchParams.getAll('expense_date'), ['gte.2026-12-01', 'lt.2027-01-01'])
  }
  assert.equal(recurring[0].searchParams.get('select'), 'amount')
  assert.equal(oneOff[0].searchParams.get('select'), 'amount')
})
