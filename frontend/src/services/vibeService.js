import { postJson } from './api.js'
import { getCompassResult } from './compassService.js'
export { getAvailableVibes } from '../logic/compassLogic.js'

export async function searchVibe(queryOrOptions, selectedPlace) {
  const { vibeQuery, currentZone, selectedZone } =
    typeof queryOrOptions === 'object'
      ? queryOrOptions
      : { vibeQuery: queryOrOptions, currentZone: selectedPlace }

  const useMockApi =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_USE_MOCK_API !== 'false'
      : true

  if (useMockApi) {
    return getCompassResult(vibeQuery, currentZone, selectedZone || 'all')
  }

  return postJson('/vibe-search', { vibeQuery, currentZone })
}
