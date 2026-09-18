import { findRoute } from '../../services/routeService.js'
import { getTripMetrics } from '../../services/trafficService.js'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
  'Content-Type': 'application/json',
}

function response(statusCode, body) {
  return { statusCode, headers, body: JSON.stringify(body) }
}

export async function handler(event = {}) {
  if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') return response(204, {})

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : event.body ?? {}
    const { origin, destination, currentTime } = body
    if (!origin || !destination) return response(400, { error: 'origin and destination are required' })

    // TODO: Titiksha — replace demo route logic with the approved Grid integration.
    const route = findRoute(origin, destination)
    if (!route) return response(404, { error: 'No demo route found for those endpoints' })

    const metrics = getTripMetrics(route, origin, destination, currentTime ? new Date(currentTime) : new Date())
    return response(200, { route, ...metrics })
  } catch {
    return response(400, { error: 'Request body must be valid JSON' })
  }
}
