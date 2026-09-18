const zones = {
  whitefield: { name: 'Whitefield', coordinates: { lat: 12.9698, lng: 77.75 } },
  indiranagar: { name: 'Indiranagar', coordinates: { lat: 12.9784, lng: 77.6408 } },
  koramangala: { name: 'Koramangala', coordinates: { lat: 12.9352, lng: 77.6245 } },
  varthur: { name: 'Varthur', coordinates: { lat: 12.9406, lng: 77.7468 } },
}

const METRO_STATIONS = [
  { name: 'Baiyappanahalli', lat: 12.9906, lng: 77.6525 },
  { name: 'Indiranagar Metro', lat: 12.9783, lng: 77.6387 },
  { name: 'Swami Vivekananda Road', lat: 12.9859, lng: 77.6449 },
  { name: 'Halasuru', lat: 12.9757, lng: 77.6258 },
  { name: 'Trinity', lat: 12.9729, lng: 77.6169 },
  { name: 'MG Road', lat: 12.9755, lng: 77.6067 },
  { name: 'Garudacharapalya', lat: 12.9852, lng: 77.7121 },
  { name: 'Hoodi', lat: 12.9866, lng: 77.7214 },
  { name: 'Whitefield (Kadugodi)', lat: 12.9961, lng: 77.7613 },
]

// In-memory cache to ensure live demo doesn't fail on rate limits or repeated queries
const routeCache = new Map()

// Helper: Haversine distance in meters
function haversineDist(lat1, lon1, lat2, lon2) {
  const R = 6371e3
  const p1 = lat1 * Math.PI / 180
  const p2 = lat2 * Math.PI / 180
  const dp = (lat2 - lat1) * Math.PI / 180
  const dl = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Point-to-line segment distance (squared)
function distToSegmentSquared(p, v, w) {
  const l2 = (w.lat - v.lat) ** 2 + (w.lng - v.lng) ** 2
  if (l2 === 0) return (p.lat - v.lat) ** 2 + (p.lng - v.lng) ** 2
  let t = ((p.lat - v.lat) * (w.lat - v.lat) + (p.lng - v.lng) * (w.lng - v.lng)) / l2
  t = Math.max(0, Math.min(1, t))
  return (p.lat - (v.lat + t * (w.lat - v.lat))) ** 2 + (p.lng - (v.lng + t * (w.lng - v.lng))) ** 2
}

// Approximation of distance in meters
function pointToLineDistMeters(pt, v, w) {
  const distDeg = Math.sqrt(distToSegmentSquared(pt, v, w))
  return distDeg * 111000 // 1 degree is roughly 111km
}

// Check if any part of the route polyline is within 500m of a metro station
function isNearMetro(polyline) {
  for (let i = 0; i < polyline.length - 1; i++) {
    const v = { lat: polyline[i][1], lng: polyline[i][0] }
    const w = { lat: polyline[i + 1][1], lng: polyline[i + 1][0] }
    
    for (const station of METRO_STATIONS) {
      if (pointToLineDistMeters(station, v, w) < 500) {
        return true
      }
    }
  }
  return false
}

function normalize(str) {
  return String(str ?? '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ')
}

export async function findRoute(originName, destName) {
  const oName = normalize(originName)
  const dName = normalize(destName)
  
  const originKey = Object.keys(zones).find(k => oName.includes(k) || k.includes(oName))
  const destKey = Object.keys(zones).find(k => dName.includes(k) || k.includes(dName))
  
  if (!originKey || !destKey || originKey === destKey) return null
  
  const o = zones[originKey]
  const d = zones[destKey]
  
  const cacheKey = `${originKey}-${destKey}`
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)
  }
  
  const originStr = `${o.coordinates.lng},${o.coordinates.lat}`
  const destStr = `${d.coordinates.lng},${d.coordinates.lat}`
  
  let result = null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500) // strict timeout to protect demo
    
    const res = await fetch(`http://router.project-osrm.org/route/v1/driving/${originStr};${destStr}?overview=full&geometries=geojson`, { 
      signal: controller.signal 
    })
    clearTimeout(timeoutId)
    
    if (res.ok) {
      const data = await res.json()
      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0]
        const durationMin = Math.ceil(routeData.duration / 60)
        const polyline = routeData.geometry.coordinates // array of [lng, lat]
        
        let segments = []
        if (isNearMetro(polyline)) {
          segments = [{ mode: 'Auto', label: 'Auto' }, { mode: 'Metro', label: 'Metro' }, { mode: 'Auto', label: 'Auto' }]
        } else {
          segments = [{ mode: 'Bus', label: 'Bus' }, { mode: 'Auto', label: 'Auto' }]
        }
        
        result = {
          id: cacheKey,
          origin: o.name,
          destination: d.name,
          originId: originKey,
          destinationId: destKey,
          segments,
          baseDurationMinutes: durationMin,
          polyline
        }
      }
    }
  } catch (err) {
    console.warn("[routeService] OSRM routing failed, falling back to Haversine", err.message)
  }
  
  // Fallback Haversine routing if OSRM failed or timed out
  if (!result) {
    const distM = haversineDist(o.coordinates.lat, o.coordinates.lng, d.coordinates.lat, d.coordinates.lng)
    // Assume 15km/h avg speed (4.16 m/s) in city traffic
    const durationMin = Math.ceil(distM / (4.16 * 60))
    
    result = {
      id: cacheKey,
      origin: o.name,
      destination: d.name,
      originId: originKey,
      destinationId: destKey,
      segments: [{ mode: 'Bus', label: 'Bus' }, { mode: 'Auto', label: 'Auto' }],
      baseDurationMinutes: durationMin,
      polyline: [[o.coordinates.lng, o.coordinates.lat], [d.coordinates.lng, d.coordinates.lat]]
    }
  }

  routeCache.set(cacheKey, result)
  return result
}
