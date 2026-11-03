import 'dotenv/config'

import { getCongestion } from './trafficService.js'

const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json'
const CACHE_TTL = 5 * 60 * 1000
const trafficCache = new Map()

function getMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY
}

function liveTrafficEnabled() {
  return process.env.ENABLE_LIVE_TRAFFIC === 'true'
}

function getCoordinates(location) {
  const lat = Number(location?.lat ?? location?.latitude)
  const lng = Number(location?.lng ?? location?.longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

function congestionColor(congestion) {
  if (congestion < 30) return 'green'
  if (congestion < 50) return 'yellow'
  if (congestion < 70) return 'orange'
  return 'red'
}

function haversineKilometers(origin, destination) {
  const earthRadius = 6371
  const latDelta = (destination.lat - origin.lat) * Math.PI / 180
  const lngDelta = (destination.lng - origin.lng) * Math.PI / 180
  const originLat = origin.lat * Math.PI / 180
  const destinationLat = destination.lat * Math.PI / 180
  const value = Math.sin(latDelta / 2) ** 2 +
    Math.sin(lngDelta / 2) ** 2 * Math.cos(originLat) * Math.cos(destinationLat)
  return 2 * earthRadius * Math.asin(Math.sqrt(value))
}

function fallbackTraffic(cafe, userLocation) {
  const destination = getCoordinates(cafe)
  const distanceKm = destination ? haversineKilometers(userLocation, destination) : 0
  const congestion = Math.max(0, Math.min(100, Math.round(getCongestion(cafe.zone))))
  const baseTravelTime = Math.max(1, Math.ceil(distanceKm / 20 * 60))
  const travelTime = Math.max(baseTravelTime, Math.round(baseTravelTime * (1 + congestion / 100)))

  return {
    ...cafe,
    congestion,
    congestionColor: congestionColor(congestion),
    travelTime,
    trafficTip: null,
  }
}

function addTips(results) {
  if (results.length === 0) return results

  const allJammed = results.every((result) => result.congestion > 70)
  const clearOption = results.find((result) => result.congestion < 30)

  if (allJammed) {
    return results.map((result) => ({
      ...result,
      trafficTip: 'All zones busy, wait 1 hour or visit early morning',
    }))
  }

  if (clearOption) {
    return results.map((result) => ({
      ...result,
      trafficTip: result.zone === clearOption.zone
        ? `${clearOption.zone} is clear right now, highly recommend`
        : result.congestion > 70
          ? 'Heavy traffic, consider alternative'
          : result.congestion < 30
            ? 'Light traffic, go now'
            : 'Moderate traffic, plan ahead',
    }))
  }

  return results.map((result) => ({
    ...result,
    trafficTip: result.congestion > 70
      ? 'Heavy traffic, consider alternative'
      : result.congestion < 30
        ? 'Light traffic, go now'
        : 'Moderate traffic, plan ahead',
  }))
}

async function getDirections(origin, destination) {
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    departure_time: 'now',
    key: getMapsApiKey(),
  })
  const response = await fetch(`${DIRECTIONS_URL}?${params}`, {
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`Google Directions request failed with ${response.status}`)

  const data = await response.json()
  if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]) {
    throw new Error(`Google Directions returned ${data.status || 'no route'}`)
  }
  return data.routes[0].legs[0]
}

function normalizeDirections(cafe, leg) {
  const normalSeconds = leg.duration?.value || 0
  const trafficSeconds = leg.duration_in_traffic?.value || normalSeconds
  const congestion = normalSeconds > 0
    ? Math.max(0, Math.min(100, Math.round(((trafficSeconds - normalSeconds) / normalSeconds) * 100)))
    : 0

  return {
    ...cafe,
    congestion,
    congestionColor: congestionColor(congestion),
    travelTime: Math.max(1, Math.round(trafficSeconds / 60)),
    trafficTip: null,
  }
}

/**
 * Adds current Google Directions traffic estimates to cafes.
 * Falls back to the existing simulated zone congestion when Google is unavailable.
 *
 * @param {Array<object>} cafes - Places containing name, zone, lat, and lng.
 * @param {{lat: number, lng: number}} userLocation - User origin coordinates.
 * @returns {Promise<Array<object>>} The same cafe objects enriched with traffic data.
 */
export async function enrichWithTraffic(cafes, userLocation) {
  if (!Array.isArray(cafes) || cafes.length === 0) return []
  const origin = getCoordinates(userLocation)
  if (!origin) return addTips(cafes.map((cafe) => ({ ...cafe, congestion: 0, congestionColor: 'green', travelTime: 0, trafficTip: 'User location is unavailable' })))

  const now = Date.now()
  const results = await Promise.all(cafes.map(async (cafe) => {
    const destination = getCoordinates(cafe)
    if (!destination || !getMapsApiKey() || !liveTrafficEnabled()) return fallbackTraffic(cafe, origin)

    const cacheKey = `${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`
    const cached = trafficCache.get(cacheKey)
    if (cached && now - cached.timestamp < CACHE_TTL) return cached.value

    try {
      const value = normalizeDirections(cafe, await getDirections(origin, destination))
      trafficCache.set(cacheKey, { timestamp: now, value })
      return value
    } catch (error) {
      console.warn(`[TrafficAwareness] ${error.message}; using simulated traffic`)
      return fallbackTraffic(cafe, origin)
    }
  }))

  return addTips(results)
}

export function clearTrafficCache() {
  trafficCache.clear()
}