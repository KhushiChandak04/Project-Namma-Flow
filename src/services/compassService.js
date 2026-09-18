import {
  extractCategory,
  getSuggestionsForCategory,
  rankByCongestion,
  enrichSuggestionsWithCongestion,
  getAlternativeZone,
  getDiscountForAlternative,
} from '../logic/compassLogic.js'

/**
 * Helper to determine congestion color.
 *
 * @param {number} percentage - Congestion percentage.
 * @returns {'red' | 'orange' | 'yellow' | 'green'} The color representation.
 */
const getCongestionColor = (percentage) => {
  if (percentage > 80) return 'red'
  if (percentage >= 60) return 'orange'
  if (percentage >= 40) return 'yellow'
  return 'green'
}

/**
 * Helper to safely extract congestion percentage from a zone object.
 *
 * @param {Object} zone - Zone object.
 * @returns {number} Congestion percentage.
 */
const getZoneCongestion = (zone) => {
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
 * Retrieves traffic-aware explorer recommendations for a natural language vibe query,
 * optionally recommending alternative zones and transit discounts if the current zone is congested.
 *
 * @param {string} vibeQuery - User's natural language search query (e.g., "cozy cafe", "live music").
 * @param {string|null} [currentZone=null] - User's current location zone (e.g., "Indiranagar").
 * @returns {Promise<{
 *   success: boolean,
 *   category: string|null,
 *   suggestions: Array<Object>,
 *   alternative: { name: string, congestion: number, congestionColor: string }|null,
 *   discount: { percentage: number, text: string }|null,
 *   message: string,
 *   error: string|null
 * }>} Compass search result object.
 *
 * @example
 * const result = await getCompassResult("cozy cafe", "Indiranagar");
 * console.log(result);
 * // {
 * //   success: true,
 * //   category: "cafes",
 * //   suggestions: [ ...top 3 suggestions ],
 * //   alternative: { name: "Koramangala", congestion: 62, congestionColor: "orange" },
 * //   discount: { percentage: 15, text: "15% Auto discount" },
 * //   message: "Indiranagar is busy! Try Koramangala instead.",
 * //   error: null
 * // }
 */
export async function getCompassResult(vibeQuery, currentZone = null) {
  try {
    // 1. Validate vibeQuery: if empty or falsy, return error
    if (!vibeQuery || typeof vibeQuery !== 'string' || !vibeQuery.trim()) {
      return {
        success: false,
        category: null,
        suggestions: [],
        alternative: null,
        discount: null,
        message: 'Please enter a vibe',
        error: 'Please enter a vibe',
      }
    }

    // 2. Call extractCategory(vibeQuery)
    const category = extractCategory(vibeQuery.trim())

    // 3. If category is null, return error
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
      }
    }

    // 4. Call getSuggestionsForCategory(category)
    const rawSuggestions = getSuggestionsForCategory(category)

    // 5. If no suggestions, return error
    if (!rawSuggestions || !Array.isArray(rawSuggestions) || rawSuggestions.length === 0) {
      const errorMsg = `No ${category} found`
      return {
        success: false,
        category,
        suggestions: [],
        alternative: null,
        discount: null,
        message: errorMsg,
        error: errorMsg,
      }
    }

    // 6. Call rankByCongestion(suggestions)
    const ranked = rankByCongestion(rawSuggestions)

    // 7. Call enrichSuggestionsWithCongestion(suggestions)
    const enriched = enrichSuggestionsWithCongestion(ranked)

    // 8. Slice to top 3: suggestions.slice(0, 3)
    const suggestions = enriched.slice(0, 3)

    // 9. If currentZone is provided:
    //    - Call getAlternativeZone(currentZone)
    //    - If alternative returned, call getDiscountForAlternative(currentZone, alternative.name)
    let alternative = null
    let discount = null

    if (currentZone && typeof currentZone === 'string' && currentZone.trim()) {
      const altZone = getAlternativeZone(currentZone.trim())
      if (altZone) {
        const altCongestion = getZoneCongestion(altZone)
        alternative = {
          name: altZone.name,
          congestion: altCongestion,
          congestionColor: getCongestionColor(altCongestion),
        }
        discount = getDiscountForAlternative(currentZone.trim(), altZone.name)
      }
    }

    // 10. Build message: if alternative, "Indiranagar is busy! Try Koramangala instead." else "Found 3 cafes nearby"
    const message = alternative
      ? `${currentZone} is busy! Try ${alternative.name} instead.`
      : `Found ${suggestions.length} ${category} nearby`

    // 11. Return full success object
    return {
      success: true,
      category,
      suggestions,
      alternative,
      discount,
      message,
      error: null,
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
    }
  }
}
