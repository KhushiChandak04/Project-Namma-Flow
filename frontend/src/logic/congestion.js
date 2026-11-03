import { findZone } from '../data/zones.js'

export const TIME_PERIODS = {
  morning: { start: 6, end: 11 },
  daytime: { start: 11, end: 17 },
  evening: { start: 17, end: 23 },
}

export const DEPARTURE_THRESHOLDS = [
  { minimum: 80, delayMinutes: 20, label: 'Leave in 20 mins (High Traffic)' },
  { minimum: 70, delayMinutes: 10, label: 'Leave in 10 mins' },
]

export function getTimePeriod(date = new Date()) {
  const hour = date.getHours()

  if (hour >= TIME_PERIODS.morning.start && hour < TIME_PERIODS.morning.end) return 'morning'
  if (hour >= TIME_PERIODS.daytime.start && hour < TIME_PERIODS.daytime.end) return 'daytime'
  if (hour >= TIME_PERIODS.evening.start && hour < TIME_PERIODS.evening.end) return 'evening'
  return hour < 6 ? 'morning' : 'evening'
}

export function getZoneCongestion(zoneId, date = new Date()) {
  const zone = typeof zoneId === 'string' ? findZone(zoneId) : zoneId
  return zone?.congestion?.[getTimePeriod(date)] ?? 0
}

export function getDepartureRecommendation(
  origin,
  destination,
  date = new Date(),
  weather = { isRainingNow: false, rainExpected: false },
) {
  const congestion = Math.max(
    getZoneCongestion(origin, date),
    getZoneCongestion(destination, date),
  )
  const period = getTimePeriod(date)

  if (weather.isRainingNow) {
    return { label: 'Rain Delay: Severe gridlock', delayMinutes: 90, congestion, period }
  }
  if (weather.rainExpected) {
    return { label: 'Rain expected in 20 min — leave now', delayMinutes: 0, congestion, period }
  }

  const threshold = DEPARTURE_THRESHOLDS.find(({ minimum }) => congestion >= minimum)
  if (threshold) {
    if (threshold.minimum === 80) {
      const later = new Date(date.getTime() + 60 * 60 * 1000)
      const laterCongestion = Math.max(
        getZoneCongestion(origin, later),
        getZoneCongestion(destination, later),
      )
      if (laterCongestion < congestion - 10) {
        return { label: 'Wait 1 hour for better traffic', delayMinutes: 60, congestion, period }
      }
    }
    return { ...threshold, congestion, period }
  }

  return { label: 'Leave NOW', delayMinutes: 0, congestion, period }
}
