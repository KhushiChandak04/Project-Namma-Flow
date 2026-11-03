import { getZoneCongestion } from '../logic/congestion.js'

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

export function estimateTravelDuration(route, destinationZone, date = new Date(), zones = []) {
  if (!route) return 0

  const congestion = getZoneCongestion(destinationZone?.id ?? destinationZone, date)
  const averageCongestion = congestion
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
    const congestionA = getZoneCongestion(a.zoneId, date)
    const congestionB = getZoneCongestion(b.zoneId, date)
    return congestionA - congestionB
  })
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
