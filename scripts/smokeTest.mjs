import assert from 'node:assert/strict'
import { zones } from '../frontend/src/data/zones.js'
import { routes } from '../frontend/src/data/routes.js'
import { vibes } from '../frontend/src/data/vibes.js'
import {
  findRoute,
  getDepartureTime,
  mapVibeQueryToCategory,
  sortSuggestionsByCongestion,
} from '../frontend/src/utils/helpers.js'

const morning = new Date('2026-09-18T08:00:00+05:30')

assert.equal(zones.length, 4, 'Expected 4 zones')
assert.equal(routes.length, 4, 'Expected 4 hardcoded corridors')
assert.ok(Object.keys(vibes).length >= 4, 'Expected vibe categories')

assert.ok(
  findRoute('Indiranagar', 'Koramangala', routes)?.id === 'ind-kor',
  'Route lookup should find Indiranagar → Koramangala',
)

assert.ok(
  findRoute('Indiranagar Main Road', 'Koramangala', routes)?.id === 'ind-kor',
  'Fuzzy route lookup should find Indiranagar Main Road → Koramangala',
)

assert.equal(mapVibeQueryToCategory('cozy cafe with good wifi'), 'cafe')
assert.equal(mapVibeQueryToCategory('live music tonight'), 'music')

const departure = getDepartureTime('Indiranagar', zones, morning)
assert.equal(departure.period, 'morning')
assert.ok(['Leave NOW', 'Leave in 10 mins', 'Leave in 20 mins'].includes(departure.label))

const sorted = sortSuggestionsByCongestion(vibes.cafe, zones, morning)
assert.equal(sorted.length, vibes.cafe.length)

console.log('Namma Flow smoke tests passed.')
