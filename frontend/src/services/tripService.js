import { mockResponses, routes, zones } from '../data/index.js'
import { findRoute, getDepartureTime, estimateTravelDuration } from '../utils/helpers.js'
import { postJson } from './api.js'

export async function getTripPlan(originOrOptions, destination, currentTime = new Date().toISOString()) {
  const options = typeof originOrOptions === 'object'
    ? originOrOptions
    : { origin: originOrOptions, destination, currentTime }
  const { origin, currentTime: requestedTime = new Date().toISOString() } = options
  destination = options.destination
  const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'

  if (!useMockApi) {
    return postJson('/trip-plan', { origin, destination, currentTime: requestedTime })
  }

  const date = new Date(requestedTime)
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
    departureRecommendation: route.id === 'wf-ind' ? mockResponses.whitefieldToIndiranagar.departureRecommendation : departureTime.label,
    travelDuration,
    congestion: departureTime.congestion,
  }
}
