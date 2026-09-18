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
    const { origin, destination, currentTime, simRain } = body
    if (!origin || !destination) return response(400, { error: 'origin and destination are required' })

    const route = await findRoute(origin, destination)
    if (!route) return response(404, { error: `No route found between ${origin} and ${destination}. Try selecting a valid zone from the dropdown.` })

    const metrics = await getTripMetrics(route, origin, destination, currentTime ? new Date(currentTime) : new Date(), Boolean(simRain))
    return response(200, { route, ...metrics })
  } catch {
    return response(400, { error: 'Request body must be valid JSON' })
  }
}
