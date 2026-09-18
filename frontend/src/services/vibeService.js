import { vibes, zones } from '../data/index.js'
import { mapVibeQueryToCategory, sortSuggestionsByCongestion } from '../utils/helpers.js'
import { postJson } from './api.js'

export async function searchVibe({ vibeQuery, currentZone }) {
  const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'

  if (!useMockApi) {
    return postJson('/vibe-search', { vibeQuery, currentZone })
  }

  const category = mapVibeQueryToCategory(vibeQuery)
  const suggestions = category ? sortSuggestionsByCongestion(vibes[category], zones) : []
  const recommendedZone = suggestions[0]?.zoneId ?? null

  return {
    category,
    suggestions,
    recommendedZone,
    discount: suggestions[0]?.discount ?? null,
    currentZone: currentZone ?? null,
  }
}
