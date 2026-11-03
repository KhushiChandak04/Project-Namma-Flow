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
    isEstimated: true,
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
    isEstimated: true,
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
    isEstimated: true,
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
    isEstimated: true,
  },
  {
    id: 'var-kor',
    origin: 'Varthur',
    destination: 'Koramangala',
    segments: [
      { mode: 'Bus', label: 'Bus' },
      { mode: 'Metro', label: 'Metro' },
      { mode: 'Auto', label: 'Auto' },
    ],
    baseDurationMinutes: 43,
    isEstimated: true,
  },
  {
    id: 'ind-wf',
    origin: 'Indiranagar',
    destination: 'Whitefield',
    segments: [
      { mode: 'Metro', label: 'Metro' },
      { mode: 'Bus', label: 'Bus' },
      { mode: 'Auto', label: 'Auto' },
    ],
    baseDurationMinutes: 58,
    isEstimated: true,
  },
  {
    id: 'kor-ind',
    origin: 'Koramangala',
    destination: 'Indiranagar',
    segments: [
      { mode: 'Auto', label: 'Auto' },
      { mode: 'Metro', label: 'Metro' },
      { mode: 'Bus', label: 'Bus' },
    ],
    baseDurationMinutes: 34,
    isEstimated: true,
  },
  {
    id: 'ind-var',
    origin: 'Indiranagar',
    destination: 'Varthur',
    segments: [
      { mode: 'Auto', label: 'Auto' },
      { mode: 'Metro', label: 'Metro' },
      { mode: 'Bus', label: 'Bus' },
    ],
    baseDurationMinutes: 46,
    isEstimated: true,
  },
  {
    id: 'kor-wf',
    origin: 'Koramangala',
    destination: 'Whitefield',
    segments: [
      { mode: 'Auto', label: 'Auto' },
      { mode: 'Metro', label: 'Metro' },
      { mode: 'Bus', label: 'Bus' },
    ],
    baseDurationMinutes: 62,
    isEstimated: true,
  },
  {
    id: 'wf-var',
    origin: 'Whitefield',
    destination: 'Varthur',
    segments: [
      { mode: 'Bus', label: 'Bus' },
      { mode: 'Auto', label: 'Auto' },
    ],
    baseDurationMinutes: 28,
    isEstimated: true,
  },
  {
    id: 'var-wf',
    origin: 'Varthur',
    destination: 'Whitefield',
    segments: [
      { mode: 'Auto', label: 'Auto' },
      { mode: 'Bus', label: 'Bus' },
    ],
    baseDurationMinutes: 28,
    isEstimated: true,
  },
  {
    id: 'kor-var',
    origin: 'Koramangala',
    destination: 'Varthur',
    segments: [
      { mode: 'Auto', label: 'Auto' },
      { mode: 'Bus', label: 'Bus' },
    ],
    baseDurationMinutes: 42,
    isEstimated: true,
  },
]

export const zoneNames = ['Whitefield', 'Indiranagar', 'Koramangala', 'Varthur']

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
