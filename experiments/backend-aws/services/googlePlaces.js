import 'dotenv/config'

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText'
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 20
const MAX_RETRIES = 2
const cache = new Map()

const MOCK_PLACES = [
  {
    name: 'Cafe Coffee Day',
    address: '5th Block, Koramangala',
    rating: 4.2,
    reviewCount: 750,
    reviews: ['Great wifi!', 'Cozy corner', 'Good coffee'],
    hours: '6 AM - 10 PM',
    zone: 'Koramangala',
    lat: 13.0352,
    lng: 77.6105,
    phone: null,
    photoUrl: null,
  },
  {
    name: 'Third Wave Coffee',
    address: '80 Feet Road, Koramangala',
    rating: 4.4,
    reviewCount: 520,
    reviews: ['Quiet work-friendly space', 'Fast wifi', 'Good coffee'],
    hours: '7 AM - 11 PM',
    zone: 'Koramangala',
    lat: 12.9352,
    lng: 77.6245,
    phone: null,
    photoUrl: null,
  },
]

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

function emptyResults(message) {
  const results = []
  Object.defineProperty(results, 'message', { value: message, enumerable: false })
  return results
}

function normalizeLimit(limit) {
  const parsed = Number(limit)
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT
  return Math.min(Math.max(Math.floor(parsed), 1), MAX_LIMIT)
}

function normalizeVibes(vibes) {
  if (!Array.isArray(vibes)) return []
  return vibes.filter((vibe) => typeof vibe === 'string' && vibe.trim()).map((vibe) => vibe.trim())
}

function getCacheKey(category, zone, vibes, limit) {
  return JSON.stringify([category.trim().toLowerCase(), zone.trim().toLowerCase(), vibes, limit])
}

function getReviewText(review) {
  return review?.text?.text || review?.text || null
}

function getHours(place) {
  return place.regularOpeningHours?.weekdayDescriptions?.join('; ') || null
}

function getPhotoUrl(place) {
  const photoName = place.photos?.[0]?.name
  if (!photoName || !process.env.GOOGLE_PLACES_API_KEY) return null

  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${encodeURIComponent(process.env.GOOGLE_PLACES_API_KEY)}`
}

function normalizePlace(place, zone) {
  const location = place.location || {}
  const reviews = (place.reviews || []).map(getReviewText).filter(Boolean).slice(0, 3)

  return {
    name: place.displayName?.text || 'Unnamed place',
    address: place.formattedAddress || zone,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? 0,
    reviews,
    hours: getHours(place),
    zone,
    lat: location.latitude ?? null,
    lng: location.longitude ?? null,
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
    photoUrl: getPhotoUrl(place),
  }
}

function mockResults(category, zone, vibes, limit) {
  const normalizedZone = zone || 'Bangalore'
  return MOCK_PLACES.filter((place) => {
    const sameZone = normalizedZone.toLowerCase() === 'bangalore' || place.zone.toLowerCase() === normalizedZone.toLowerCase()
    const matchesCategory = place.name.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes('cafe')
    const matchesVibe = vibes.length === 0 || vibes.some((vibe) => place.reviews.join(' ').toLowerCase().includes(vibe.toLowerCase()))
    return sameZone && matchesCategory && matchesVibe
  })
    .slice(0, limit)
    .map((place) => ({ ...place, zone: normalizedZone }))
}

async function requestPlaces(query, limit) {
  let attempt = 0

  while (attempt <= MAX_RETRIES) {
    const response = await fetch(PLACES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': [
          'places.displayName',
          'places.formattedAddress',
          'places.rating',
          'places.userRatingCount',
          'places.reviews',
          'places.regularOpeningHours',
          'places.location',
          'places.nationalPhoneNumber',
          'places.internationalPhoneNumber',
          'places.photos',
        ].join(','),
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: limit,
        languageCode: 'en',
        regionCode: 'IN',
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (response.status !== 429 || attempt === MAX_RETRIES) {
      if (!response.ok) throw new Error(`Google Places request failed with ${response.status}`)
      return response.json()
    }

    await wait(250 * 2 ** attempt)
    attempt += 1
  }
}

/**
 * Searches Google Places Text Search for places in a Bangalore zone.
 * Returns mock data when the API key is absent or Google is unavailable.
 *
 * @param {string} category - Category such as "cafes" or "parks".
 * @param {string} zone - Bangalore zone such as "Koramangala".
 * @param {string[]} vibes - Optional vibe terms such as ["cozy", "wifi"].
 * @param {number} limit - Optional result limit, capped at 20.
 * @returns {Promise<Array<object>>} Normalized places, or [] when no places match.
 */
export async function searchPlaces(category, zone, vibes = [], limit = DEFAULT_LIMIT) {
  if (typeof category !== 'string' || !category.trim() || typeof zone !== 'string' || !zone.trim()) {
    return emptyResults('Category and zone are required')
  }

  const normalizedCategory = category.trim()
  const normalizedZone = zone.trim()
  const normalizedVibes = normalizeVibes(vibes)
  const normalizedLimit = normalizeLimit(limit)
  const cacheKey = getCacheKey(normalizedCategory, normalizedZone, normalizedVibes, normalizedLimit)

  if (cache.has(cacheKey)) {
    const cachedResults = cache.get(cacheKey)
    return cachedResults.length > 0 ? cachedResults : emptyResults('No places found for this search')
  }

  const fallback = () => {
    const results = mockResults(normalizedCategory, normalizedZone, normalizedVibes, normalizedLimit)
    return results.length > 0 ? results : emptyResults('No places found for this search')
  }
  if (!process.env.GOOGLE_PLACES_API_KEY) return fallback()

  const query = `${normalizedCategory} ${normalizedVibes.join(' ')} in ${normalizedZone}, Bangalore`.replace(/\s+/g, ' ').trim()

  try {
    const data = await requestPlaces(query, normalizedLimit)
    const results = (data.places || []).map((place) => normalizePlace(place, normalizedZone))
    cache.set(cacheKey, results)
    return results.length > 0 ? results : emptyResults('No places found for this search')
  } catch (error) {
    console.warn(`[GooglePlaces] ${error.message}; using mock fallback`)
    return fallback()
  }
}

export function clearPlacesCache() {
  cache.clear()
}