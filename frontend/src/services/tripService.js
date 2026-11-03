import { planTrip } from '../logic/tripLogic.js'
import { getTransitRoute } from './transitService.js'

export async function getTripPlan(originOrOptions, destination, currentTime = new Date().toISOString()) {
  const options = typeof originOrOptions === 'object'
    ? originOrOptions
    : { origin: originOrOptions, destination, currentTime }
  const plan = planTrip({
    origin: options.origin,
    destination: options.destination,
    simRain: options.simRain,
    currentTime: options.currentTime ?? currentTime,
  })

  if (!plan) {
    throw new Error('No demo route found for those locations.')
  }

  try {
    const transitRoute = await getTransitRoute(options.origin, options.destination)
    if (transitRoute) {
      plan.route = {
        ...plan.route,
        ...transitRoute,
        id: `${plan.route.id}-overpass`,
      }
      plan.travelDurationNoRain = Math.round(
        transitRoute.baseDurationMinutes
        * (1 + (plan.congestion / 100) ** 2)
        * (plan.isRushHour ? 1.25 : 1),
      )
      plan.travelDuration = Math.round(
        plan.travelDurationNoRain
        * (plan.weather.isRainingNow ? (plan.isRushHour ? 1.8 : 1.4) : 1),
      )
    }
  } catch (error) {
    console.warn('Using simulated route because transit data is unavailable:', error.message)
  }

  return plan
}
