import { findZone } from '../data/zones.js'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const BANGALORE_BBOX = '12.8,77.4,13.2,77.9'
let stationsPromise = null

function distanceInKilometers(first, second) {
  const earthRadius = 6371
  const latitudeDelta = (second.lat - first.lat) * Math.PI / 180
  const longitudeDelta = (second.lng - first.lng) * Math.PI / 180
  const latitude = first.lat * Math.PI / 180
  const secondLatitude = second.lat * Math.PI / 180
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

export function findNearestStation(coordinates, stations) {
  if (!coordinates || !Array.isArray(stations) || stations.length === 0) return null
  return stations.reduce((nearest, station) => {
    const distance = distanceInKilometers(coordinates, station.coordinates)
    return !nearest || distance < nearest.distance
      ? { station, distance }
      : nearest
  }, null)
}

export function buildMetroRoute(originZone, destinationZone, stations) {
  const originNearest = findNearestStation(originZone.coordinates, stations)
  const destinationNearest = findNearestStation(destinationZone.coordinates, stations)
  if (!originNearest || !destinationNearest) return null

  if (originNearest.station.id === destinationNearest.station.id) {
    const walkMinutes = Math.max(5, Math.round(originNearest.distance * 12))
    return {
      segments: [{
        mode: 'Walk',
        label: `Walk estimate to ${destinationZone.name}`,
        durationMinutes: walkMinutes,
      }],
      baseDurationMinutes: walkMinutes,
      busOption: {
        mode: 'Bus',
        label: 'Bus (estimated; timings not live)',
        durationMinutes: walkMinutes,
      },
      isEstimated: true,
      transitSource: 'overpass',
      stationNames: [originNearest.station.name],
    }
  }

  const stationCount = Math.max(
    1,
    Math.round(distanceInKilometers(
      originNearest.station.coordinates,
      destinationNearest.station.coordinates,
    ) / 1.2),
  )
  const firstLegMode = originNearest.distance > 1.5 ? 'Auto' : 'Walk'
  const lastLegMode = destinationNearest.distance > 1.5 ? 'Auto' : 'Walk'
  const firstLegMinutes = Math.max(5, Math.round(originNearest.distance * (firstLegMode === 'Auto' ? 5 : 12)))
  const lastLegMinutes = Math.max(5, Math.round(destinationNearest.distance * (lastLegMode === 'Auto' ? 5 : 12)))
  const metroMinutes = Math.round(stationCount * 2.5)

  return {
    segments: [
      {
        mode: firstLegMode,
        label: `${firstLegMode} to ${originNearest.station.name}`,
        durationMinutes: firstLegMinutes,
      },
      {
        mode: 'Metro',
        label: `Metro: ${originNearest.station.name} → ${destinationNearest.station.name} (estimated)`,
        durationMinutes: metroMinutes,
      },
      {
        mode: lastLegMode,
        label: `${lastLegMode} from ${destinationNearest.station.name}`,
        durationMinutes: lastLegMinutes,
      },
    ],
    baseDurationMinutes: firstLegMinutes + metroMinutes + lastLegMinutes,
    busOption: {
      mode: 'Bus',
      label: 'Bus (estimated; timings not live)',
      durationMinutes: Math.round((firstLegMinutes + metroMinutes + lastLegMinutes) * 1.2),
    },
    isEstimated: true,
    transitSource: 'overpass',
    stationNames: [originNearest.station.name, destinationNearest.station.name],
  }
}

function normalizeStation(element) {
  const tags = element?.tags ?? {}
  const name = tags.name
  if (!name || !Number.isFinite(element.lat) || !Number.isFinite(element.lon)) return null
  return {
    id: String(element.id),
    name,
    coordinates: { lat: element.lat, lng: element.lon },
  }
}

async function fetchStations() {
  const query = `[out:json][timeout:25];
(
  node["railway"="station"]["station"="subway"](${BANGALORE_BBOX});
  node["railway"="station"]["operator"~"Namma Metro|Bangalore Metro Rail Corporation",i](${BANGALORE_BBOX});
);
out body;`
  const response = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`)
  if (!response.ok) throw new Error(`Overpass request failed with ${response.status}`)
  const payload = await response.json()
  return (payload.elements ?? []).map(normalizeStation).filter(Boolean)
}

export function getMetroStations() {
  if (!stationsPromise) {
    stationsPromise = fetchStations().catch((error) => {
      stationsPromise = null
      throw error
    })
  }
  return stationsPromise
}

export async function getTransitRoute(origin, destination) {
  const originZone = findZone(origin)
  const destinationZone = findZone(destination)
  if (!originZone || !destinationZone) return null

  const stations = await getMetroStations()
  const metroRoute = buildMetroRoute(originZone, destinationZone, stations)
  if (!metroRoute) return null

  return {
    origin: originZone.name,
    destination: destinationZone.name,
    ...metroRoute,
  }
}
