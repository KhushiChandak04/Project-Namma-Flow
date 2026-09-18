/**
 * Four hardcoded corridors for the Namma Flow MVP.
 * These are application demo corridors, not live transit schedules.
 */
export const routes = [
  {
    id: 'wf-ind',
    origin: 'Whitefield',
    destination: 'Indiranagar',
    segments: [
      { mode: 'Bus', label: 'Bus 306' },
      { mode: 'Metro', label: 'Metro' },
      { mode: 'Auto', label: 'Auto' },
    ],
    baseDurationMinutes: 58,
  },
  {
    id: 'ind-kor',
    origin: 'Indiranagar',
    destination: 'Koramangala',
    segments: [
      { mode: 'Metro', label: 'Metro' },
      { mode: 'Bus', label: 'Bus' },
      { mode: 'Auto', label: 'Auto' },
    ],
    baseDurationMinutes: 34,
  },
  {
    id: 'var-ind',
    origin: 'Varthur',
    destination: 'Indiranagar',
    segments: [
      { mode: 'Bus', label: 'Bus' },
      { mode: 'Metro', label: 'Metro' },
      { mode: 'Auto', label: 'Auto' },
    ],
    baseDurationMinutes: 46,
  },
  {
    id: 'wf-kor',
    origin: 'Whitefield',
    destination: 'Koramangala',
    segments: [
      { mode: 'Bus', label: 'Bus' },
      { mode: 'Metro', label: 'Metro' },
      { mode: 'Auto', label: 'Auto' },
    ],
    baseDurationMinutes: 62,
  },
]

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
}

export function findRouteByEndpoints(origin, destination) {
  const normalizedOrigin = normalize(origin)
  const normalizedDestination = normalize(destination)

  return (
    routes.find(
      (route) =>
        normalize(route.origin) === normalizedOrigin &&
        normalize(route.destination) === normalizedDestination,
    ) ?? null
  )
}
