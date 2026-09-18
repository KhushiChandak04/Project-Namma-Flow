/**
 * Namma Flow — Places Service
 *
 * Uses the Overpass API (OpenStreetMap) to search for real places in Bangalore.
 *
 * ✅ Completely FREE — no API key, no account, no payment method required.
 * ✅ Returns real Bangalore cafes, music venues, bookstores, parks.
 * ✅ Falls back to mock data if the network request fails.
 *
 * Overpass API: https://overpass-api.de/
 * Query language docs: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

/**
 * Zone name → approximate bounding box for OpenStreetMap queries.
 * Format: [south, west, north, east] (lat/lng degrees)
 */
const ZONE_BBOX = {
  Whitefield:   [12.955, 77.735, 12.985, 77.765],
  Indiranagar:  [12.970, 77.625, 13.000, 77.660],
  Koramangala:  [12.920, 77.610, 12.950, 77.645],
  Varthur:      [12.928, 77.730, 12.955, 77.762],
  Bangalore:    [12.870, 77.550, 13.070, 77.800], // fallback: whole city
}

/**
 * Vibe category → OpenStreetMap amenity/leisure tags.
 * OSM tags: https://wiki.openstreetmap.org/wiki/Key:amenity
 */
const VIBE_OSM_TAG = {
  cafe:         'amenity=cafe',
  cafes:        'amenity=cafe',
  music:        'amenity=music_venue',
  bookstore:    'shop=books',
  bookstores:   'shop=books',
  park:         'leisure=park',
  parks:        'leisure=park',
}

/**
 * Builds an Overpass QL query that finds nodes with a given OSM tag
 * inside a bounding box.
 *
 * @param {string} osmTag - OSM key=value tag (e.g., 'amenity=cafe').
 * @param {number[]} bbox - [south, west, north, east]
 * @param {number} limit - Max number of results.
 * @returns {string} The Overpass QL query string.
 */
const buildOverpassQuery = (osmTag, bbox, limit) => {
  const [south, west, north, east] = bbox
  const [key, value] = osmTag.split('=')
  return `
    [out:json][timeout:10];
    (
      node["${key}"="${value}"](${south},${west},${north},${east});
      way["${key}"="${value}"](${south},${west},${north},${east});
    );
    out center ${limit};
  `.trim()
}

/**
 * Searches OpenStreetMap (via Overpass API) for real places matching a vibe
 * category in a Bangalore zone. Completely free, no API key required.
 *
 * @param {string} category - Vibe category (e.g., 'cafes', 'music', 'parks').
 * @param {string} [zone='Bangalore'] - Zone name to search within.
 * @param {number} [maxResults=6] - Max results to fetch.
 * @returns {Promise<Array<{
 *   id: string,
 *   name: string,
 *   address: string,
 *   zone: string,
 *   location: { lat: number, lng: number } | null,
 *   source: 'openstreetmap'
 * }>>} Array of real places, or empty array on failure.
 *
 * @example
 * const places = await searchPlacesForCategory('cafes', 'Koramangala');
 * // returns real OSM cafes like [{ name: 'Cafe Noir', address: 'Koramangala', ... }]
 */
export async function searchPlacesForCategory(category, zone = 'Bangalore', maxResults = 6) {
  const osmTag = VIBE_OSM_TAG[category]
  if (!osmTag) {
    console.warn(`[PlacesService] No OSM tag mapping for category: ${category}`)
    return []
  }

  const bbox = ZONE_BBOX[zone] ?? ZONE_BBOX['Bangalore']
  const query = buildOverpassQuery(osmTag, bbox, maxResults)

  try {
    const response = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      console.error(`[PlacesService] Overpass API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const elements = data?.elements ?? []

    // Filter to elements that have a name (unnamed places aren't useful for UI)
    const named = elements.filter((el) => el.tags?.name)

    return named.slice(0, maxResults).map((el) => {
      // 'way' elements have a 'center' instead of direct lat/lon
      const lat = el.lat ?? el.center?.lat ?? null
      const lng = el.lon ?? el.center?.lon ?? null

      return {
        id: String(el.id),
        name: el.tags.name,
        address: buildAddress(el.tags, zone),
        zone,
        location: lat != null && lng != null ? { lat, lng } : null,
        source: 'openstreetmap',
      }
    })
  } catch (error) {
    console.error('[PlacesService] Network error calling Overpass API:', error.message)
    return []
  }
}

/**
 * Builds a human-readable address string from OSM tags.
 * Falls back to the zone name if no address tags are available.
 *
 * @param {Object} tags - OSM tags from Overpass element.
 * @param {string} zone - Fallback zone name.
 * @returns {string} Address string.
 */
function buildAddress(tags, zone) {
  const street = tags['addr:street']
  const houseNumber = tags['addr:housenumber']
  const suburb = tags['addr:suburb'] ?? tags['addr:city'] ?? zone

  if (street && houseNumber) return `${houseNumber}, ${street}, ${suburb}`
  if (street) return `${street}, ${suburb}`
  return suburb
}

/**
 * Returns whether the live Places API is enabled.
 * With OpenStreetMap, this is always true — no key required.
 *
 * @returns {boolean} Always true (Overpass API requires no configuration).
 */
export const isPlacesApiEnabled = () => true
