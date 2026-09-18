const congestion = {
  whitefield: { morning: 82, daytime: 54, evening: 76 },
  indiranagar: { morning: 64, daytime: 58, evening: 88 },
  koramangala: { morning: 58, daytime: 62, evening: 79 },
  varthur: { morning: 71, daytime: 42, evening: 63 },
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

export function getTripMetrics(route, origin, destination, date = new Date()) {
  const congestionValue = Math.max(getCongestion(origin, date), getCongestion(destination, date))
  const delayMinutes = congestionValue >= 85 ? 20 : congestionValue >= 70 ? 10 : 0
  return {
    departureTime: { label: delayMinutes ? `Leave in ${delayMinutes} mins` : 'Leave NOW', delayMinutes, congestion: congestionValue, period: periodFor(date) },
    travelDuration: route ? Math.max(route.baseDurationMinutes, Math.round(route.baseDurationMinutes * (1 + congestionValue / 160))) : 0,
    congestion: congestionValue,
  }
}
