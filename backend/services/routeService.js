const routes = [
  { id: 'wf-ind', origin: 'Whitefield', destination: 'Indiranagar', segments: [{ mode: 'Bus', label: 'Bus 306' }, { mode: 'Metro', label: 'Metro' }, { mode: 'Auto', label: 'Auto' }], baseDurationMinutes: 58 },
  { id: 'ind-kor', origin: 'Indiranagar', destination: 'Koramangala', segments: [{ mode: 'Metro', label: 'Metro' }, { mode: 'Bus', label: 'Bus' }, { mode: 'Auto', label: 'Auto' }], baseDurationMinutes: 34 },
  { id: 'var-ind', origin: 'Varthur', destination: 'Indiranagar', segments: [{ mode: 'Bus', label: 'Bus' }, { mode: 'Metro', label: 'Metro' }, { mode: 'Auto', label: 'Auto' }], baseDurationMinutes: 46 },
  { id: 'wf-kor', origin: 'Whitefield', destination: 'Koramangala', segments: [{ mode: 'Bus', label: 'Bus 306' }, { mode: 'Metro', label: 'Metro' }, { mode: 'Auto', label: 'Auto' }], baseDurationMinutes: 62 },
]

function normalize(value) {
  return String(value ?? '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ')
}

function score(query, name) {
  const a = normalize(query)
  const b = normalize(name)
  if (!a || !b) return 0
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) return 0.9
  return 0
}

export function findRoute(origin, destination) {
  return routes
    .map((route) => ({ route, score: (score(origin, route.origin) + score(destination, route.destination)) / 2 }))
    .filter((candidate) => candidate.score >= 0.55)
    .sort((a, b) => b.score - a.score)[0]?.route ?? null
}

export { routes }
