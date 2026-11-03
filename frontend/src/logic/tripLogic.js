import { routes } from '../data/routes.js'
import { getDepartureRecommendation, getZoneCongestion } from './congestion.js'

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
}

export function findTripRoute(origin, destination, availableRoutes = routes) {
  const normalizedOrigin = normalize(origin)
  const normalizedDestination = normalize(destination)

  return availableRoutes.find((route) => (
    normalize(route.origin) === normalizedOrigin &&
    normalize(route.destination) === normalizedDestination
  )) ?? null
}

export function planTrip(
  { origin, destination, currentTime, simRain = false },
  availableRoutes = routes,
) {
  const route = findTripRoute(origin, destination, availableRoutes)
  if (!route) return null

  const date = currentTime ? new Date(currentTime) : new Date()
  const weather = {
    isRainingNow: Boolean(simRain),
    rainExpected: Boolean(simRain),
    precipitation: simRain ? 15 : 0,
  }
  const originCongestion = getZoneCongestion(origin, date)
  const destinationCongestion = getZoneCongestion(destination, date)
  const congestion = Math.max(originCongestion, destinationCongestion)
  const hour = date.getHours()
  const isRushHour = (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)
  const rushHourMultiplier = isRushHour ? 1.25 : 1
  const rainPenaltyMultiplier = weather.isRainingNow ? (isRushHour ? 1.8 : 1.4) : 1
  const multiplierNoRain = (1 + (congestion / 100) ** 2) * rushHourMultiplier
  const travelDurationNoRain = Math.round(route.baseDurationMinutes * multiplierNoRain)
  const travelDuration = Math.round(
    route.baseDurationMinutes * multiplierNoRain * rainPenaltyMultiplier,
  )
  let chaosScore = congestion * 0.4
  if (isRushHour) chaosScore += 20
  if (weather.isRainingNow) chaosScore += 40
  chaosScore = Math.min(100, Math.round(chaosScore))

  return {
    route,
    departureTime: getDepartureRecommendation(origin, destination, date, weather),
    travelDuration,
    travelDurationNoRain,
    congestion,
    weather,
    chaosScore,
    isRushHour,
  }
}
