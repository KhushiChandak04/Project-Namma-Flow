import { routes, zones } from '../data/index.js'
import { findRoute, getDepartureTime, estimateTravelDuration } from '../utils/helpers.js'
import { postJson } from './api.js'

export async function getTripPlan({ origin, destination, currentTime = new Date().toISOString() }) {
  const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'

  if (!useMockApi) {
    return postJson('/trip-plan', { origin, destination, currentTime })
  }

  const date = new Date(currentTime)
  const route = findRoute(origin, destination, routes)

  if (!route) {
    return {
      route: null,
      departureTime: getDepartureTime(destination, zones, date),
      travelDuration: 0,
      congestion: null,
    }
  }

  const departureTime = getDepartureTime(destination, zones, date)
  const travelDuration = estimateTravelDuration(route, destination, date, zones)

  return {
    route,
    departureTime,
    travelDuration,
    congestion: departureTime.congestion,
  }
}
