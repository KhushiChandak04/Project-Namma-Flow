import { ZONES, VIBES } from '../utils/data/index.js'
import { getCongestionColor } from '../utils/helpers.js'

/**
 * Helper to look up a zone in the ZONES collection by name, id, or object reference.
 *
 * @param {string|Object} zoneInput - Zone name, ID, or zone object.
 * @returns {Object|null} The matching zone object, or null if not found.
 */
const findZoneInDataset = (zoneInput) => {
  if (!zoneInput || !Array.isArray(ZONES)) return null

  if (typeof zoneInput === 'object') {
    if (zoneInput.congestion !== undefined) return zoneInput
    zoneInput = zoneInput.name || zoneInput.id || zoneInput.zone || zoneInput.zoneId || ''
  }

  const normalized = String(zoneInput).trim().toLowerCase()
  if (!normalized) return null

  return (
    ZONES.find((z) => {
      const name = String(z.name || '').trim().toLowerCase()
      const id = String(z.id || '').trim().toLowerCase()
      return name === normalized || id === normalized
    }) ||
    ZONES.find((z) => {
      const name = String(z.name || '').trim().toLowerCase()
      const id = String(z.id || '').trim().toLowerCase()
      return name.includes(normalized) || normalized.includes(name) || id.includes(normalized)
    }) ||
    null
  )
}

/**
 * Helper to safely extract the current congestion percentage value from a zone object.
 *
 * @param {Object} zone - The zone object.
 * @returns {number} The congestion percentage value (0-100).
 */
const getZoneCongestionValue = (zone) => {
  if (!zone) return 0
  if (typeof zone === 'number') return zone
  if (typeof zone.congestion === 'number') return zone.congestion
  if (zone.congestion && typeof zone.congestion.now === 'number') {
    return zone.congestion.now
  }
  if (zone.congestion && typeof zone.congestion === 'object') {
    return (
      zone.congestion.now ??
      zone.congestion.daytime ??
      zone.congestion.evening ??
      zone.congestion.morning ??
      0
    )
  }
  return 0
}

/**
 * Helper to derive a congestion severity label from a congestion percentage.
 *
 * @param {number} percentage - The congestion percentage.
 * @returns {string} Severity label ('Very High', 'High', 'Moderate', or 'Low').
 */
const getCongestionLabel = (percentage) => {
  if (percentage > 80) return 'Very High'
  if (percentage >= 60) return 'High'
  if (percentage >= 40) return 'Moderate'
  return 'Low'
}

/**
 * Extracts a matching vibe category name from a natural language query
 * by matching keywords against the VIBES dataset.
 *
 * @param {string} vibeQuery - User's natural language query (e.g., "cozy cafe with good wifi").
 * @returns {string|null} The first matching category name (e.g., "cafes"), or null if no match.
 *
 * @example
 * extractCategory("cozy cafe with good wifi");
 * // returns "cafes"
 *
 * extractCategory("unknown query xyz");
 * // returns null
 */
export const extractCategory = (vibeQuery) => {
  if (!vibeQuery || typeof vibeQuery !== 'string' || !VIBES || typeof VIBES !== 'object') {
    return null
  }

  const normalizedQuery = vibeQuery.toLowerCase()

  for (const [category, categoryData] of Object.entries(VIBES)) {
    const keywords = categoryData?.keywords
    if (Array.isArray(keywords)) {
      const hasMatch = keywords.some((keyword) => {
        if (!keyword) return false
        return normalizedQuery.includes(String(keyword).toLowerCase())
      })
      if (hasMatch) {
        return category
      }
    }
  }

  return null
}

/**
 * Retrieves all suggestions for a given vibe category from the VIBES dataset.
 *
 * @param {string} category - Category name (e.g., "cafes").
 * @returns {Array<Object>} Array of suggestion objects from VIBES[category].suggestions, or empty array if not found.
 *
 * @example
 * getSuggestionsForCategory("cafes");
 * // returns [{ id: 'cafe-1', name: 'Cozy Cafe Cluster', zone: 'Koramangala', ... }, ...]
 *
 * getSuggestionsForCategory("nonexistent");
 * // returns []
 */
export const getSuggestionsForCategory = (category) => {
  if (!category || !VIBES || typeof VIBES !== 'object') {
    return []
  }

  const categoryData = VIBES[category]
  if (!categoryData) {
    return []
  }

  if (Array.isArray(categoryData.suggestions)) {
    return categoryData.suggestions
  }

  if (Array.isArray(categoryData)) {
    return categoryData
  }

  return []
}

/**
 * Ranks suggestions by current zone congestion in ascending order (least congested first).
 * Returns a new array without mutating the original.
 *
 * @param {Array<Object>} suggestions - Array of suggestions, each having a "zone" property.
 * @returns {Array<Object>} New sorted array of suggestions (ascending by zone.congestion.now).
 *
 * @example
 * const suggestions = [
 *   { name: 'Cafe A', zone: 'Indiranagar' }, // e.g. 88% congestion
 *   { name: 'Cafe B', zone: 'Varthur' }       // e.g. 42% congestion
 * ];
 * rankByCongestion(suggestions);
 * // returns [{ name: 'Cafe B', ... }, { name: 'Cafe A', ... }]
 */
export const rankByCongestion = (suggestions) => {
  if (!Array.isArray(suggestions)) {
    return []
  }

  return [...suggestions].sort((a, b) => {
    const zoneA = findZoneInDataset(a?.zone || a?.zoneId)
    const zoneB = findZoneInDataset(b?.zone || b?.zoneId)

    const congestionA = getZoneCongestionValue(zoneA)
    const congestionB = getZoneCongestionValue(zoneB)

    return congestionA - congestionB
  })
}

/**
 * Enriches suggestions with zone congestion percentage, mapped color, and descriptive label.
 *
 * @param {Array<Object>} suggestions - Array of suggestion objects.
 * @returns {Array<Object>} Enriched suggestion objects containing congestionPercent, congestionColor, and congestionLabel.
 *
 * @example
 * const suggestions = [{ name: 'Cozy Cafe', zone: 'Indiranagar' }];
 * enrichSuggestionsWithCongestion(suggestions);
 * // returns [{ name: 'Cozy Cafe', zone: 'Indiranagar', congestionPercent: 88, congestionColor: 'red', congestionLabel: 'Very High' }]
 */
export const enrichSuggestionsWithCongestion = (suggestions) => {
  if (!Array.isArray(suggestions)) {
    return []
  }

  return suggestions.map((suggestion) => {
    const zone = findZoneInDataset(suggestion?.zone || suggestion?.zoneId)
    const congestionPercent = getZoneCongestionValue(zone)
    const congestionColor = getCongestionColor(congestionPercent)
    const congestionLabel = getCongestionLabel(congestionPercent)

    return {
      ...suggestion,
      congestionPercent,
      congestionColor,
      congestionLabel,
    }
  })
}

/**
 * Suggests an alternative zone if the current zone has severe traffic (>= 70% congestion).
 * Selects the zone with the lowest congestion among all other zones.
 *
 * @param {string|Object} currentZone - Current zone name (e.g., "Indiranagar") or zone object.
 * @returns {Object|null} The alternative zone object with lowest congestion, or null if no alternative needed/available.
 *
 * @example
 * getAlternativeZone("Indiranagar");
 * // returns { id: 'varthur', name: 'Varthur', congestion: { now: 42, ... } }
 *
 * getAlternativeZone("Varthur"); // congestion 42% (< 70%)
 * // returns null
 */
export const getAlternativeZone = (currentZone) => {
  if (!currentZone || !Array.isArray(ZONES) || ZONES.length <= 1) {
    return null
  }

  const currentZoneObj = findZoneInDataset(currentZone)
  if (!currentZoneObj) {
    return null
  }

  const currentCongestion = getZoneCongestionValue(currentZoneObj)
  if (currentCongestion < 70) {
    return null
  }

  const otherZones = ZONES.filter((zone) => {
    const isSameName =
      String(zone.name || '').toLowerCase() === String(currentZoneObj.name || '').toLowerCase()
    const isSameId = zone.id && currentZoneObj.id && zone.id === currentZoneObj.id
    return !isSameName && !isSameId
  })

  if (otherZones.length === 0) {
    return null
  }

  let lowestZone = otherZones[0]
  let lowestCongestion = getZoneCongestionValue(lowestZone)

  for (let i = 1; i < otherZones.length; i += 1) {
    const candidate = otherZones[i]
    const candidateCongestion = getZoneCongestionValue(candidate)
    if (candidateCongestion < lowestCongestion) {
      lowestCongestion = candidateCongestion
      lowestZone = candidate
    }
  }

  return lowestZone
}

/**
 * Calculates transit discount incentives when shifting from a congested zone to an alternative zone.
 * - difference > 40: 20% Metro discount
 * - difference > 25: 15% Auto discount
 * - difference > 10: 10% ride discount
 * - Otherwise: null
 *
 * @param {string|Object} currentZone - Current zone name or object.
 * @param {string|Object} alternativeZone - Alternative zone name or object.
 * @returns {{ percentage: number, text: string }|null} Discount details or null if no qualifying difference.
 *
 * @example
 * getDiscountForAlternative("Indiranagar", "Varthur"); // 88 - 42 = 46
 * // returns { percentage: 20, text: "20% Metro discount" }
 *
 * getDiscountForAlternative("Indiranagar", "Koramangala"); // 88 - 62 = 26
 * // returns { percentage: 15, text: "15% Auto discount" }
 *
 * getDiscountForAlternative("Koramangala", "Whitefield");
 * // returns null
 */
export const getDiscountForAlternative = (currentZone, alternativeZone) => {
  if (!currentZone || !alternativeZone) {
    return null
  }

  const currentObj = findZoneInDataset(currentZone)
  const altObj = findZoneInDataset(alternativeZone)

  if (!currentObj || !altObj) {
    return null
  }

  const currentCongestion = getZoneCongestionValue(currentObj)
  const altCongestion = getZoneCongestionValue(altObj)

  const difference = currentCongestion - altCongestion

  if (difference > 40) {
    return { percentage: 20, text: '20% Metro discount' }
  }
  if (difference > 25) {
    return { percentage: 15, text: '15% Auto discount' }
  }
  if (difference > 10) {
    return { percentage: 10, text: '10% ride discount' }
  }

  return null
}

/**
 * Returns available vibe categories for carousel / UI selection.
 * Pure data helper for Compass exploration.
 *
 * @returns {Array<{ id: string, title: string, icon: string, description: string, sampleQuery: string }>}
 */
export const getAvailableVibes = () => [
  {
    id: 'cafe',
    title: 'Cozy Cafes',
    icon: '☕',
    description: 'Work-friendly spots & specialty brews',
    sampleQuery: 'cozy cafe',
  },
  {
    id: 'restaurant',
    title: 'Family Restaurants',
    icon: '🍽️',
    description: 'Casual & fine dining for gatherings',
    sampleQuery: 'family restaurant',
  },
  {
    id: 'park',
    title: 'Quiet Parks',
    icon: '🌳',
    description: 'Tranquil gardens & lakeside trails',
    sampleQuery: 'quiet park',
  },
  {
    id: 'music',
    title: 'Live Music',
    icon: '🎵',
    description: 'Acoustic sessions, gigs & nightlife',
    sampleQuery: 'live music',
  },
  {
    id: 'bookstore',
    title: 'Bookstores & Hubs',
    icon: '📚',
    description: 'Independent bookshops & reading rooms',
    sampleQuery: 'bookstore',
  },
]
