import { postJson } from './api.js'
import { handler as tripPlanHandler } from '../../../backend/lambdas/trip-plan/handler.js'

export async function getTripPlan(originOrOptions, destination, currentTime = new Date().toISOString()) {
  const options = typeof originOrOptions === 'object'
    ? originOrOptions
    : { origin: originOrOptions, destination, currentTime }
  const { origin, simRain, currentTime: requestedTime = new Date().toISOString() } = options
  destination = options.destination
  const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'

  if (!useMockApi) {
    return postJson('/trip-plan', { origin, destination, simRain, currentTime: requestedTime })
  }

  // Use the actual backend lambda logic locally!
  const event = {
    body: JSON.stringify({ origin, destination, simRain, currentTime: requestedTime })
  }
  
  const response = await tripPlanHandler(event)
  const body = JSON.parse(response.body)
  
  if (response.statusCode !== 200) {
    throw new Error(body.error || 'Failed to fetch trip plan')
  }
  
  return body
}
