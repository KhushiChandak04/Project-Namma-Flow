import { findZone } from '../data/zones.js'

export const TIME_PERIODS = {
  morning: { start: 6, end: 11 },
  daytime: { start: 11, end: 17 },
  evening: { start: 17, end: 23 },
}

export function getTimePeriod(date = new Date()) {
  const hour = date.getHours()

  if (hour >= TIME_PERIODS.morning.start && hour < TIME_PERIODS.morning.end) return 'morning'
  if (hour >= TIME_PERIODS.daytime.start && hour < TIME_PERIODS.daytime.end) return 'daytime'
  if (hour >= TIME_PERIODS.evening.start && hour < TIME_PERIODS.evening.end) return 'evening'
  return hour < 6 ? 'morning' : 'evening'
}

export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
}

function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index)

  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0]
    row[0] = i

    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j]
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      previous = current
    }
  }

  return row[b.length]
}

function fuzzyZoneScore(query, zoneName) {
  const a = normalizeText(query)
  const b = normalizeText(zoneName)
  if (!a || !b) return 0
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) return 0.9

  const maxLength = Math.max(a.length, b.length)
  return maxLength === 0 ? 0 : 1 - levenshtein(a, b) / maxLength
}

export function findRoute(origin, destination, routes) {
  if (!origin || !destination || !Array.isArray(routes)) return null

  const exact = routes.find(
    (route) =>
      fuzzyZoneScore(origin, route.origin) === 1 &&
      fuzzyZoneScore(destination, route.destination) === 1,
  )

  if (exact) return exact

  const candidates = routes
    .map((route) => ({
      route,
      score: (fuzzyZoneScore(origin, route.origin) + fuzzyZoneScore(destination, route.destination)) / 2,
    }))
    .filter(({ score }) => score >= 0.55)
    .sort((a, b) => b.score - a.score)

  return candidates[0]?.route ?? null
}

export function getCongestionForZone(zone, date = new Date()) {
  const resolvedZone = typeof zone === 'string' ? findZone(zone) : zone
  if (!resolvedZone) return 0

  const period = getTimePeriod(date)
  return resolvedZone.congestion?.[period] ?? 0
}

export function getDepartureTime(destination, zones, now = new Date()) {
  const resolvedZone = typeof destination === 'string' ? findZoneFromCollection(destination, zones) : destination
  if (!resolvedZone) {
    return {
      label: 'Leave NOW',
      delayMinutes: 0,
      congestion: 0,
      period: getTimePeriod(now),
    }
  }

  const period = getTimePeriod(now)
  const congestion = resolvedZone.congestion?.[period] ?? 0

  if (congestion >= 85) {
    return { label: 'Leave in 20 mins', delayMinutes: 20, congestion, period }
  }
  if (congestion >= 70) {
    return { label: 'Leave in 10 mins', delayMinutes: 10, congestion, period }
  }
  return { label: 'Leave NOW', delayMinutes: 0, congestion, period }
}

function findZoneFromCollection(query, zones) {
  if (!Array.isArray(zones)) return null

  return zones
    .map((zone) => ({ zone, score: fuzzyZoneScore(query, zone.name) }))
    .sort((a, b) => b.score - a.score)[0]?.zone ?? null
}

export function estimateTravelDuration(route, destinationZone, date = new Date(), zones = []) {
  if (!route) return 0

  const congestion = getCongestionForZone(destinationZone, date)
  const resolvedZone = typeof destinationZone === 'string' ? findZoneFromCollection(destinationZone, zones) : destinationZone
  const originCongestion = resolvedZone ? getCongestionForZone(resolvedZone, date) : congestion
  const averageCongestion = Math.max(congestion, originCongestion)
  const multiplier = 1 + Math.min(averageCongestion, 100) / 160

  return Math.max(route.baseDurationMinutes, Math.round(route.baseDurationMinutes * multiplier))
}

export function mapVibeQueryToCategory(query) {
  const text = normalizeText(query)

  const keywordMap = {
    cafe: ['cafe', 'coffee', 'cozy cafe', 'cozy', 'study cafe', 'work cafe', 'wifi'],
    music: ['music', 'live music', 'concert', 'band', 'acoustic', 'gig', 'pub', 'nightlife'],
    bookstore: ['book', 'books', 'bookstore', 'reading', 'literature', 'library'],
    park: ['park', 'parks', 'green', 'quiet outdoor', 'garden', 'walk', 'nature', 'quiet park', 'peaceful'],
    restaurant: ['restaurant', 'restaurants', 'family restaurant', 'dining', 'food', 'dinner', 'lunch', 'eat', 'eats', 'bistro'],
  }

  for (const [category, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((keyword) => text.includes(keyword))) return category
  }

  return null
}

export function sortSuggestionsByCongestion(suggestions, zones, date = new Date()) {
  if (!Array.isArray(suggestions)) return []

  return [...suggestions].sort((a, b) => {
    const congestionA = getCongestionForZone(a.zoneId, dateWithZones(date, zones))
    const congestionB = getCongestionForZone(b.zoneId, dateWithZones(date, zones))
    return congestionA - congestionB
  })
}

function dateWithZones(date) {
  return date
}

export function getZoneLabel(zoneId, zones) {
  return zones.find((zone) => zone.id === zoneId)?.name ?? zoneId
}

export function getCongestionLabel(value) {
  if (value >= 85) return 'Very High'
  if (value >= 70) return 'High'
  if (value >= 50) return 'Moderate'
  return 'Low'
}

/**
 * Maps a congestion percentage to a color representation.
 * - red if >80
 * - orange if 60-80
 * - yellow if 40-60
 * - green if <40
 *
 * @param {number} percentage - Congestion percentage (0-100)
 * @returns {'red' | 'orange' | 'yellow' | 'green'} Color name
 */
export const getCongestionColor = (percentage) => {
  if (percentage > 80) return 'red'
  if (percentage >= 60) return 'orange'
  if (percentage >= 40) return 'yellow'
  return 'green'
}

