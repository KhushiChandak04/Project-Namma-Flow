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
    zone: place.zone ?? DEMO_ZONES[index % DEMO_ZONES.length],
    category,
    source: 'google',
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
export async function getCompassResult(vibeQuery, currentZone = null) {
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
    const category = extractCategory(vibeQuery.trim())
    if (!category) {
      const errorMsg = `No suggestions found for "${vibeQuery}"`
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

    // Step 3: Fetch suggestions — Google Places if API key exists, otherwise mock
    let rawSuggestions = []
    let source = 'mock'

    // Try live OpenStreetMap data first (no key required, always available)
    const zoneName = currentZone?.trim() || 'Bangalore'
    const osmPlaces = await searchPlacesForCategory(category, zoneName, 6)

    if (osmPlaces.length > 0) {
      rawSuggestions = mergePlacesWithZones(osmPlaces, category)
      source = 'openstreetmap'
    }

    // Fall back to mock data if OSM returned nothing (e.g. network offline)
    if (rawSuggestions.length === 0) {
      rawSuggestions = getSuggestionsForCategory(category)
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
    const ranked = rankByCongestion(rawSuggestions)
    const enriched = enrichSuggestionsWithCongestion(ranked)

    // Step 5: Take top 3
    const suggestions = enriched.slice(0, 3)

    // Step 6: Check if current zone is jammed and suggest alternative
    let alternative = null
    let discount = null

    if (currentZone && typeof currentZone === 'string' && currentZone.trim()) {
      const altZone = getAlternativeZone(currentZone.trim())
      if (altZone) {
        const altCongestion = zoneCongestion(altZone)
        alternative = {
          name: altZone.name,
          congestion: altCongestion,
          congestionColor: toColor(altCongestion),
        }
        discount = getDiscountForAlternative(currentZone.trim(), altZone.name)
      }
    }

    // Step 7: Build human-readable message
    const message = alternative
      ? `${currentZone} is busy! Try ${alternative.name} instead.`
      : `Found ${suggestions.length} ${category} nearby`

    return {
      success: true,
      category,
      suggestions,
      alternative,
      discount,
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
