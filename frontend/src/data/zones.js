/**
 * Namma Flow simulated zone data.
 *
 * Source-defined zones: Whitefield, Indiranagar, Koramangala, Varthur.
 * Numeric congestion values are demo/simulation values for the hackathon MVP.
 * Scale: 0 = free-flowing, 100 = heavily congested.
 */
export const zones = [
  {
    id: 'whitefield',
    name: 'Whitefield',
    type: 'commuter',
    congestion: {
      morning: 82,
      daytime: 54,
      evening: 76,
    },
    coordinates: { lat: 12.9698, lng: 77.75 },
  },
  {
    id: 'indiranagar',
    name: 'Indiranagar',
    type: 'mixed',
    congestion: {
      morning: 64,
      daytime: 58,
      evening: 88,
    },
    coordinates: { lat: 12.9784, lng: 77.6408 },
  },
  {
    id: 'koramangala',
    name: 'Koramangala',
    type: 'mixed',
    congestion: {
      morning: 58,
      daytime: 62,
      evening: 79,
    },
    coordinates: { lat: 12.9352, lng: 77.6245 },
  },
  {
    id: 'varthur',
    name: 'Varthur',
    type: 'residential',
    congestion: {
      morning: 71,
      daytime: 42,
      evening: 63,
    },
    coordinates: { lat: 12.9406, lng: 77.7468 },
  },
]

export const zoneMap = Object.fromEntries(zones.map((zone) => [zone.id, zone]))

export function findZone(query) {
  if (!query) return null

  const normalized = String(query).trim().toLowerCase()
  return (
    zones.find(
      (zone) =>
        zone.id === normalized ||
        zone.name.toLowerCase() === normalized ||
        zone.name.toLowerCase().includes(normalized) ||
        normalized.includes(zone.name.toLowerCase()),
    ) ?? null
  )
}
