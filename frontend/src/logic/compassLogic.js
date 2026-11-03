import { zones } from '../data/zones.js'
import { vibes } from '../data/vibes.js'
import { getCongestionColor } from '../utils/helpers.js'
import { getZoneCongestion } from './congestion.js'

const categoryKeywords = {
  cafe: ['cafe', 'coffee', 'cozy', 'study', 'work', 'wifi'],
  music: ['music', 'concert', 'band', 'acoustic', 'gig', 'pub', 'nightlife'],
  bookstore: ['book', 'books', 'bookstore', 'reading', 'literature', 'library'],
  park: ['park', 'green', 'outdoor', 'garden', 'walk', 'nature', 'quiet'],
  restaurant: ['restaurant', 'dining', 'food', 'dinner', 'lunch', 'eat', 'bistro'],
}

function findZone(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return zones.find((zone) => (
    zone.id === normalized ||
    zone.name.toLowerCase() === normalized ||
    zone.name.toLowerCase().includes(normalized) ||
    normalized.includes(zone.name.toLowerCase())
  )) ?? null
}

export function extractCategory(query) {
  const normalized = String(query ?? '').toLowerCase()
  return Object.entries(categoryKeywords)
    .find(([, keywords]) => keywords.some((keyword) => (
      new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`).test(normalized)
    )))?.[0] ?? null
}

export function getSuggestionsForCategory(category) {
  return vibes[category] ?? []
}

export function rankByCongestion(suggestions, date = new Date()) {
  if (!Array.isArray(suggestions)) return []
  return [...suggestions].sort((a, b) => (
    getZoneCongestion(a?.zoneId ?? a?.zone, date) -
    getZoneCongestion(b?.zoneId ?? b?.zone, date)
  ))
}

export function enrichSuggestionsWithCongestion(suggestions, date = new Date()) {
  if (!Array.isArray(suggestions)) return []
  return suggestions.map((suggestion) => {
    const congestionPercent = getZoneCongestion(suggestion?.zoneId ?? suggestion?.zone, date)
    return {
      ...suggestion,
      congestionPercent,
      congestionColor: getCongestionColor(congestionPercent),
      congestionLabel: congestionPercent > 80 ? 'Very High' : congestionPercent >= 60 ? 'High' : congestionPercent >= 40 ? 'Moderate' : 'Low',
    }
  })
}

export function getAlternativeZone(currentZone, date = new Date()) {
  const zone = findZone(currentZone)
  if (!zone || getZoneCongestion(zone.id, date) < 70) return null
  return zones
    .filter((candidate) => candidate.id !== zone.id)
    .sort((a, b) => getZoneCongestion(a.id, date) - getZoneCongestion(b.id, date))[0] ?? null
}

export function getDiscountForAlternative(currentZone, alternativeZone) {
  const suggestion = Object.values(vibes)
    .flat()
    .find((item) => item.zoneId === alternativeZone?.id && item.discount)
  return suggestion?.discount ?? null
}

export function getAvailableVibes() {
  return Object.keys(vibes)
}
