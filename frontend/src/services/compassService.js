/**
 * Namma Flow — Compass Service (Frontend)
 *
 * Orchestrates the full Compass "find-a-vibe" flow:
 *   1. Extract category from user's natural language query
 *   2. Fetch real places from Google Places API (if key is configured)
 *      OR fall back to mock suggestions from VIBES data
 *   3. Rank suggestions by zone congestion (least jammed first)
 *   4. Enrich each suggestion with congestion color and label
 *   5. Suggest an alternative zone + transit discount if current zone is jammed
 *
 * Set VITE_GOOGLE_PLACES_API_KEY in frontend/.env to enable live results.
 * Leave it empty to use demo/mock data (useful for local dev and the hackathon demo).
 */

import {
  extractCategory,
  getSuggestionsForCategory,
  rankByCongestion,
  enrichSuggestionsWithCongestion,
  getAlternativeZone,
  getDiscountForAlternative,
} from '../logic/compassLogic.js'
import { searchPlacesForCategory } from './placesService.js'
import { zones } from '../data/zones.js'
import { vibes } from '../data/vibes.js'

/**
 * Maps a congestion percentage to a color.
 * @param {number} pct - Congestion percentage (0-100)
 * @returns {'red'|'orange'|'yellow'|'green'}
 */
const toColor = (pct) => {
  if (pct > 80) return 'red'
  if (pct >= 60) return 'orange'
  if (pct >= 40) return 'yellow'
  return 'green'
}

/**
 * Safely reads congestion.now from a zone object.
 * @param {Object} zone
 * @returns {number}
 */
const zoneCongestion = (zone) => {
  if (!zone) return 0
  if (typeof zone.congestion === 'number') return zone.congestion
  return zone.congestion?.now ?? zone.congestion?.daytime ?? 0
}

const nearestZone = (location) => {
  if (!location) return null
  return zones.reduce((nearest, zone) => {
    const distance =
      (location.lat - zone.coordinates.lat) ** 2 +
      (location.lng - zone.coordinates.lng) ** 2
    return !nearest || distance < nearest.distance
      ? { zone, distance }
      : nearest
  }, null)?.zone.name
}

const categoryKey = (category) =>
  category === 'cafes' ? 'cafe' :
  category === 'parks' ? 'park' :
  category === 'bookstores' ? 'bookstore' : category

const categoryLabel = (category) => categoryKey(category)

const zoneMatches = (suggestion, zoneId) =>
  zoneId === 'all' || suggestion.zoneId === zoneId

const getMockSuggestions = (category, zoneId) => {
  const categorySuggestions = vibes[categoryKey(category)] ?? []
  return categorySuggestions
    .filter((suggestion) => zoneMatches(suggestion, zoneId))
    .map((suggestion) => ({ ...suggestion, source: 'mock' }))
}

/**
 * Merges Google Places results with congestion data from VIBES zone data.
 * Google gives us real names/addresses; congestion comes from our ZONES dataset.
 *
 * @param {Array<Object>} googlePlaces - Results from Google Places API.
 * @param {string} category - The matched vibe category.
 * @returns {Array<Object>} Suggestions in the same shape as mock suggestions.
 */
const mergePlacesWithZones = (googlePlaces, category) => {
  // Cycle through our demo zones to assign congestion data to real places
  const DEMO_ZONES = ['Koramangala', 'Varthur', 'Indiranagar', 'Whitefield']

  return googlePlaces.map((place, index) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    rating: place.rating,
    googleMapsUri: place.googleMapsUri,
    location: place.location,
    zone: place.zone === 'Bangalore'
      ? nearestZone(place.location) ?? DEMO_ZONES[index % DEMO_ZONES.length]
      : place.zone ?? DEMO_ZONES[index % DEMO_ZONES.length],
    category,
    source: place.source ?? 'openstreetmap',
    discount: null, // discounts come from getDiscountForAlternative
  }))
}

/**
 * Main Compass orchestration function.
 *
 * Searches for real Bangalore places matching a vibe query, ranked by
 * how congested their zone is right now. If the user's current zone is
 * jammed (>= 70% congestion), recommends a quieter alternative and offers
 * a transit incentive to switch.
 *
 * @param {string} vibeQuery - Natural language query (e.g., "cozy cafe with good wifi").
 * @param {string|null} [currentZone=null] - User's current zone (e.g., "Indiranagar").
 * @returns {Promise<{
 *   success: boolean,
 *   category: string|null,
 *   suggestions: Array<Object>,
 *   alternative: { name: string, congestion: number, congestionColor: string }|null,
 *   discount: { percentage: number, text: string }|null,
 *   message: string,
 *   error: string|null,
 *   source: 'google'|'mock'
 * }>}
 *
 * @example
 * // With Google Places API key set:
 * const result = await getCompassResult("cozy cafe", "Indiranagar");
 * // => real Blue Tokai, Third Wave Coffee results ranked by congestion
 *
 * // Without API key (mock mode):
 * const result = await getCompassResult("cozy cafe", "Indiranagar");
 * // => demo suggestions from vibes.js ranked by congestion
 */
export async function getCompassResult(vibeQuery, currentZone = null, selectedZone = 'all') {
  try {
    // Step 1: Validate input
    if (!vibeQuery || typeof vibeQuery !== 'string' || !vibeQuery.trim()) {
      return {
        success: false,
        category: null,
        suggestions: [],
        alternative: null,
        discount: null,
        message: 'Please enter a vibe',
        error: 'Please enter a vibe',
        source: 'mock',
      }
    }

    // Step 2: Extract category from vibe query
    let category = extractCategory(vibeQuery.trim())
    if (!category) {
      // For the demo, allow dynamic searches to pass through!
      category = vibeQuery.trim().toLowerCase()
    }

    // Step 3: Fetch suggestions — Google Places if API key exists, otherwise mock
    let rawSuggestions = []
    let source = 'mock'

    // Try live OpenStreetMap data first (no key required, always available)
    const zoneName = selectedZone && selectedZone !== 'all' ? selectedZone : 'Bangalore'
    const osmPlaces = await searchPlacesForCategory(category, zoneName, 5)

    if (osmPlaces.length > 0) {
      rawSuggestions = mergePlacesWithZones(osmPlaces, category)
      if (selectedZone && selectedZone !== 'all' && rawSuggestions.length < 3) {
        const existingNames = new Set(rawSuggestions.map((suggestion) => suggestion.name))
        rawSuggestions = [
          ...rawSuggestions,
          ...getMockSuggestions(category, selectedZone).filter(
            (suggestion) => !existingNames.has(suggestion.name),
          ),
        ].slice(0, 3)
      }
      source = 'openstreetmap'
    }

    // Fall back to mock data if OSM returned nothing (e.g. network offline)
    if (rawSuggestions.length === 0) {
      rawSuggestions = getMockSuggestions(category, selectedZone || 'all')
      
      // If no static mock data matches this dynamic category/zone, generate a plausible one!
      if (rawSuggestions.length === 0) {
        rawSuggestions = [{
          id: `mock-dynamic-${Date.now()}`,
          name: `The ${category.charAt(0).toUpperCase() + category.slice(1)} Spot`,
          address: `${zoneName} Main Road`,
          rating: 4.2 + Math.random() * 0.7,
          zone: zoneName,
          category,
          source: 'mock'
        }]
      }
      source = 'mock'
    }

    if (!rawSuggestions || rawSuggestions.length === 0) {
      const errorMsg = `No ${category} found`
      return {
        success: false,
        category,
        suggestions: [],
        alternative: null,
        discount: null,
        message: errorMsg,
        error: errorMsg,
        source,
      }
    }

    // Step 4: Rank by zone congestion (least jammed first) + enrich with congestion metadata
    let activeSearchZone = selectedZone
    if (!activeSearchZone || activeSearchZone === 'all') {
      activeSearchZone = currentZone // fallback to where the user is currently located
    }
    
    const selectedZoneObject = activeSearchZone
      ? zones.find((zone) => zone.id.toLowerCase() === activeSearchZone.toLowerCase() || zone.name.toLowerCase() === activeSearchZone.toLowerCase())
      : null
    const selectedCongestion = zoneCongestion(selectedZoneObject)

    // Step 5: A selected high-traffic zone redirects the result set itself.
    let alternative = null
    let discount = null
    const primarySuggestions = rawSuggestions
    let redirectSuggestions = []

    if (selectedZoneObject) {
      const altZone = getAlternativeZone(selectedZoneObject.name)
      if (altZone) {
        const altCongestion = zoneCongestion(altZone)
        alternative = {
          name: altZone.name,
          congestion: altCongestion,
          congestionColor: toColor(altCongestion),
        }
        discount = getDiscountForAlternative(selectedZoneObject.name, altZone.name)
        const alternativePlaces = await searchPlacesForCategory(category, altZone.name, 5)
        redirectSuggestions = alternativePlaces.length
          ? mergePlacesWithZones(alternativePlaces, category)
          : getMockSuggestions(category, altZone.id)
      }
    }

    const ranked = rankByCongestion(primarySuggestions)
    const enriched = enrichSuggestionsWithCongestion(ranked)
    const suggestions = enriched.slice(0, 5)
    const redirected = enrichSuggestionsWithCongestion(
      rankByCongestion(redirectSuggestions),
    ).slice(0, 5)

    // Step 7: Build human-readable message
    const verdict = selectedZoneObject && selectedCongestion >= 70
      ? {
          zone: selectedZoneObject.name,
          congestion: selectedCongestion,
          text: `Traffic in ${selectedZoneObject.name} is very high at ${selectedCongestion}%. Try a similar ${categoryLabel(category)} in ${alternative?.name || 'Koramangala'} instead.`,
          alternative: alternative?.name || 'Koramangala',
          incentive: discount?.text || '10% ride discount',
        }
      : {
          zone: selectedZoneObject?.name || 'Bangalore',
          congestion: selectedCongestion,
          text: selectedZoneObject
            ? `Traffic in ${selectedZoneObject.name} is manageable at ${selectedCongestion}%. These are the best matching ${categoryLabel(category)} options there.`
            : `Here are the best matching ${categoryLabel(category)} options across Bangalore, ranked by simulated traffic load.`,
          alternative: null,
          incentive: null,
        }

    const message = alternative
      ? `${currentZone} is busy! Try ${alternative.name} instead.`
      : `Found ${suggestions.length} ${category} across Bangalore`

    return {
      success: true,
      category,
      suggestions,
      redirectSuggestions: redirected,
      alternative,
      discount,
      verdict,
      message,
      error: null,
      source,
    }
  } catch (error) {
    const errorMsg = error?.message || 'An unexpected error occurred'
    return {
      success: false,
      category: null,
      suggestions: [],
      alternative: null,
      discount: null,
      message: errorMsg,
      error: errorMsg,
      source: 'mock',
    }
  }
}
