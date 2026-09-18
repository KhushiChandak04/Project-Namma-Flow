import { mockResponses, vibes, zones } from '../data/index.js'
import {
  mapVibeQueryToCategory,
  getCongestionColor,
  getCongestionLabel,
} from '../utils/helpers.js'
import { postJson } from './api.js'
export { getAvailableVibes } from '../logic/compassLogic.js'

/**
 * Safely derives current congestion from a zone object.
 */
function getZoneCongestion(zone) {
  if (!zone) return 50
  if (typeof zone === 'number') return zone
  if (typeof zone.congestion === 'number') return zone.congestion
  return (
    zone.congestion?.now ??
    zone.congestion?.evening ??
    zone.congestion?.daytime ??
    zone.congestion?.morning ??
    50
  )
}

/**
 * Normalizes zone identifier / string to matching zone in zones dataset.
 */
function resolveZone(zoneInput) {
  if (!zoneInput) return null
  const query = String(zoneInput).trim().toLowerCase()
  return (
    zones.find(
      (z) =>
        z.id.toLowerCase() === query ||
        z.name.toLowerCase() === query ||
        z.name.toLowerCase().includes(query) ||
        query.includes(z.name.toLowerCase()),
    ) ?? null
  )
}

/**
 * Calculates transit discount incentive when switching from a congested zone to a calmer one.
 */
function computeDiscount(currentCongestion, targetCongestion) {
  const diff = currentCongestion - targetCongestion
  if (diff > 40) return { percentage: 20, text: '20% Metro discount' }
  if (diff > 25) return { percentage: 15, text: '15% Auto discount' }
  if (diff > 10) return { percentage: 10, text: '10% Ride discount' }
  return null
}

/**
 * Smart, zone-aware search for Namma Flow Compass.
 *
 * Provides distinct, customized suggestions based on the user's selected zone:
 * - If current zone is heavily congested (>= 70%): recommends lower-congestion alternative zone,
 *   highlights transit discounts to switch zones, and flags local traffic warnings.
 * - If current zone has moderate congestion (50-69%): showcases local favorites with optional
 *   calmer alternatives.
 * - If current zone is low congestion (< 50%): highlights local clear-traffic spots with zero travel delay.
 */
export async function searchVibe(queryOrOptions, selectedZone) {
  const { vibeQuery, currentZone } =
    typeof queryOrOptions === 'object'
      ? queryOrOptions
      : { vibeQuery: queryOrOptions, currentZone: selectedZone }

  const useMockApi =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_USE_MOCK_API !== 'false'
      : true

  if (!useMockApi) {
    return postJson('/vibe-search', { vibeQuery, currentZone })
  }

  const category = mapVibeQueryToCategory(vibeQuery)
  if (!category || !vibes[category]) {
    return {
      category: null,
      suggestions: [],
      recommendedZone: null,
      currentZone: currentZone ?? null,
      discount: null,
      message: `No demo suggestions matched "${vibeQuery}" yet. Try "quiet park", "cozy cafe", "family restaurant", or "live music".`,
      demoResponse: null,
    }
  }

  const allCategorySuggestions = vibes[category] || []
  const currentZoneObj = resolveZone(currentZone) || zones.find((z) => z.id === 'indiranagar')
  const currentZoneId = currentZoneObj.id.toLowerCase()
  const currentCongestion = getZoneCongestion(currentZoneObj)

  // Find lowest congestion zone in the city
  const sortedZones = [...zones].sort(
    (a, b) => getZoneCongestion(a) - getZoneCongestion(b),
  )
  const lowestCongestionZone = sortedZones[0]
  const lowestCongestion = getZoneCongestion(lowestCongestionZone)

  // Build enriched suggestions with zone traffic data
  const enrichedSuggestions = allCategorySuggestions.map((item) => {
    const itemZoneObj = resolveZone(item.zoneId)
    const congestion = getZoneCongestion(itemZoneObj)
    const isLocal = item.zoneId?.toLowerCase() === currentZoneId
    return {
      ...item,
      zoneName: itemZoneObj?.name || item.zoneId,
      congestionPercent: congestion,
      congestionColor: getCongestionColor(congestion),
      congestionLabel: getCongestionLabel(congestion),
      isLocal,
    }
  })

  let orderedSuggestions = []
  let recommendedZone = currentZoneId
  let discount = null
  let message = ''
  let adviceType = 'local' // 'diversion' | 'moderate' | 'optimal'

  if (currentCongestion >= 70) {
    // Current zone is heavily congested (e.g. Indiranagar 88%, Whitefield 76%)
    adviceType = 'diversion'
    recommendedZone = lowestCongestionZone.id

    const discountObj = computeDiscount(currentCongestion, lowestCongestion)
    discount = discountObj?.text || '15% demo offer'

    // Separate into alternative quiet places vs local places
    const quietSpots = enrichedSuggestions.filter(
      (s) => s.zoneId?.toLowerCase() === lowestCongestionZone.id,
    )
    const otherCalmSpots = enrichedSuggestions.filter(
      (s) =>
        s.zoneId?.toLowerCase() !== lowestCongestionZone.id &&
        !s.isLocal &&
        s.congestionPercent < currentCongestion,
    )
    const localSpots = enrichedSuggestions.filter((s) => s.isLocal)

    orderedSuggestions = [
      ...quietSpots.map((s, idx) => ({
        ...s,
        tag: idx === 0 ? '🌟 Recommended Escape' : '🌿 Quiet Green Spot',
        discount: discount,
      })),
      ...otherCalmSpots.map((s) => ({
        ...s,
        tag: '⭐ Alternative Option',
        discount: s.discount || '10% demo offer',
      })),
      ...localSpots.map((s) => ({
        ...s,
        tag: `📍 In ${currentZoneObj.name} (High Traffic)`,
        discount: null,
      })),
    ]

    message = `${currentZoneObj.name} is currently heavily congested (${currentCongestion}% traffic). Skip the gridlock and head to ${lowestCongestionZone.name} (${lowestCongestion}% traffic) — get ${discount} on your ride!`
  } else if (currentCongestion >= 55) {
    // Current zone is moderate (e.g. Koramangala 62%)
    adviceType = 'moderate'
    recommendedZone = currentZoneId

    const localSpots = enrichedSuggestions.filter((s) => s.isLocal)
    const quietSpots = enrichedSuggestions.filter(
      (s) => s.zoneId?.toLowerCase() === lowestCongestionZone.id,
    )
    const otherSpots = enrichedSuggestions.filter(
      (s) => !s.isLocal && s.zoneId?.toLowerCase() !== lowestCongestionZone.id,
    )

    const discountObj = computeDiscount(currentCongestion, lowestCongestion)

    orderedSuggestions = [
      ...localSpots.map((s, idx) => ({
        ...s,
        tag: idx === 0 ? `📍 Best in ${currentZoneObj.name}` : '📍 Local Favorite',
        discount: s.discount || '10% demo offer',
      })),
      ...quietSpots.map((s) => ({
        ...s,
        tag: `🌟 Quieter Option (${lowestCongestionZone.name})`,
        discount: discountObj?.text || '10% Ride discount',
      })),
      ...otherSpots.map((s) => ({
        ...s,
        tag: '⭐ Alternate Zone',
      })),
    ]

    message = `${currentZoneObj.name} has moderate traffic (${currentCongestion}%). You have great local spots nearby, or take a quick hop to ${lowestCongestionZone.name} for even quieter surroundings.`
  } else {
    // Current zone is already low congestion (e.g. Varthur 42%)
    adviceType = 'optimal'
    recommendedZone = currentZoneId

    const localSpots = enrichedSuggestions.filter((s) => s.isLocal)
    const otherSpots = enrichedSuggestions
      .filter((s) => !s.isLocal)
      .sort((a, b) => a.congestionPercent - b.congestionPercent)

    orderedSuggestions = [
      ...localSpots.map((s, idx) => ({
        ...s,
        tag: idx === 0 ? `🌟 Top Spot in ${currentZoneObj.name}` : '🌿 Local Serene Spot',
        discount: s.discount || '15% demo offer',
      })),
      ...otherSpots.map((s) => ({
        ...s,
        tag: `⭐ Nearby in ${s.zoneName}`,
      })),
    ]

    message = `Great choice! ${currentZoneObj.name} is currently clear and quiet (${currentCongestion}% traffic). Stay local and enjoy your evening with zero traffic delay!`
  }

  return {
    category,
    suggestions: orderedSuggestions.slice(0, 4),
    recommendedZone,
    currentZone: currentZoneObj.name,
    currentZoneCongestion: currentCongestion,
    currentZoneColor: getCongestionColor(currentCongestion),
    currentZoneLabel: getCongestionLabel(currentCongestion),
    adviceType,
    discount,
    message,
    demoResponse: category === 'music' ? mockResponses.liveMusic : null,
  }
}
