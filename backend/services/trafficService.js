const congestion = {
  whitefield: { morning: 82, daytime: 54, evening: 76 },
  indiranagar: { morning: 64, daytime: 58, evening: 88 },
  koramangala: { morning: 58, daytime: 62, evening: 79 },
  varthur: { morning: 71, daytime: 42, evening: 63 },
}

let weatherCache = { timestamp: 0, data: null }
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getLiveWeather(simRain) {
  if (simRain) {
    return { isRainingNow: true, rainExpected: true, precipitation: 15.0 }
  }
  
  const now = Date.now()
  if (now - weatherCache.timestamp < CACHE_TTL && weatherCache.data) {
    return weatherCache.data
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)
    // Bangalore coordinates
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current=precipitation&hourly=precipitation&timezone=Asia%2FKolkata`, { signal: controller.signal })
    clearTimeout(timeout)
    
    if (res.ok) {
      const data = await res.json()
      const currentPrecip = data.current?.precipitation || 0
      
      // Check next 3 hours
      const currentHour = new Date().getHours()
      const hourly = data.hourly?.precipitation || []
      // Time is formatted hourly from midnight, so we index by hour.
      const next3Hours = hourly.slice(currentHour, currentHour + 3)
      const rainExpected = next3Hours.some(p => p > 0.5)
      
      const result = {
        isRainingNow: currentPrecip > 0.5,
        rainExpected,
        precipitation: currentPrecip
      }
      
      weatherCache = { timestamp: now, data: result }
      return result
    }
  } catch (err) {
    console.warn("[trafficService] Weather API failed, falling back to clear weather", err.message)
  }
  
  return { isRainingNow: false, rainExpected: false, precipitation: 0 }
}

function periodFor(date) {
  const hour = date.getHours()
  if (hour >= 6 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'daytime'
  if (hour >= 17 && hour < 23) return 'evening'
  return hour < 6 ? 'morning' : 'evening'
}

function zoneId(value) {
  return String(value ?? '').toLowerCase().trim().replace(/[^a-z0-9]/g, '')
}

export function getCongestion(zone, date = new Date()) {
  const values = congestion[zoneId(zone)]
  return values?.[periodFor(date)] ?? 0
}

export async function getTripMetrics(route, origin, destination, date = new Date(), simRain = false) {
  const baseCongestionValue = Math.max(getCongestion(origin, date), getCongestion(destination, date))
  
  // 1. Fetch live weather
  const weather = await getLiveWeather(simRain)
  
  // 2. Calculate Rush Hour Multiplier
  const hour = date.getHours()
  const isRushHour = (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)
  const rushHourMultiplier = isRushHour ? 1.25 : 1.0
  
  // 3. Calculate Rain Penalty
  // Rain during rush hour is exponentially worse.
  let rainPenaltyMultiplier = 1.0
  if (weather.isRainingNow) {
    rainPenaltyMultiplier = isRushHour ? 1.8 : 1.4
  }
  
  const finalMultiplier = (1 + Math.pow(baseCongestionValue / 100, 2)) * rushHourMultiplier * rainPenaltyMultiplier
  const travelDuration = route ? Math.round(route.baseDurationMinutes * finalMultiplier) : 0
  
  // Without rain calculation for before/after comparison
  const multiplierNoRain = (1 + Math.pow(baseCongestionValue / 100, 2)) * rushHourMultiplier
  const travelDurationNoRain = route ? Math.round(route.baseDurationMinutes * multiplierNoRain) : 0
  
  // 4. Synthesize Chaos Score (0-100)
  // Base congestion (up to 40 points) + Rush hour (up to 20 points) + Rain (up to 40 points)
  let chaosScore = (baseCongestionValue * 0.4)
  if (isRushHour) chaosScore += 20
  if (weather.isRainingNow) chaosScore += 40
  else if (weather.rainExpected) chaosScore += 15
  
  chaosScore = Math.min(100, Math.round(chaosScore))
  
  // Departure time behavior
  let delayMinutes = 0
  let label = 'Leave NOW'
  
  if (weather.isRainingNow) {
    label = 'Rain Delay: Severe gridlock'
    delayMinutes = 90
  } else if (weather.rainExpected) {
    label = 'Rain expected in 20 min — leave now'
    delayMinutes = 0
  } else if (baseCongestionValue >= 80) {
    const later = new Date(date.getTime() + 60 * 60 * 1000)
    const laterCongestion = Math.max(getCongestion(origin, later), getCongestion(destination, later))
    
    if (laterCongestion < baseCongestionValue - 10) {
      delayMinutes = 60
      label = 'Wait 1 hour for better traffic'
    } else {
      delayMinutes = 20
      label = `Leave in 20 mins (High Traffic)`
    }
  } else if (baseCongestionValue >= 70) {
    delayMinutes = 10
    label = `Leave in 10 mins`
  }

  return {
    departureTime: { label, delayMinutes, congestion: baseCongestionValue, period: periodFor(date) },
    travelDuration,
    travelDurationNoRain,
    congestion: baseCongestionValue,
    weather,
    chaosScore,
    isRushHour
  }
}
