import { classifyVibe } from '../../services/bedrockService.js'

const suggestions = {
  cafe: [
    { id: 'cafe-1', name: 'Cozy Cafe Cluster', category: 'cafe', zoneId: 'koramangala', discount: '10% demo offer' },
    { id: 'cafe-2', name: 'Quiet Cafe Corner', category: 'cafe', zoneId: 'varthur', discount: '15% demo offer' },
  ],
  music: [
    { id: 'music-1', name: 'Live Music District', category: 'music', zoneId: 'koramangala', discount: '10% demo offer' },
    { id: 'music-2', name: 'Acoustic Nights Venue', category: 'music', zoneId: 'varthur', discount: '15% demo offer' },
  ],
  bookstore: [{ id: 'bookstore-1', name: 'Independent Bookstore', category: 'bookstore', zoneId: 'koramangala', discount: '10% demo offer' }],
  park: [{ id: 'park-1', name: 'Quiet Green Space', category: 'park', zoneId: 'varthur', discount: '15% demo offer' }],
}

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
    if (!body.vibeQuery) return response(400, { error: 'vibeQuery is required' })

    // TODO: Shravya — replace local classification with Amazon Bedrock once configured.
    const { category } = await classifyVibe(body.vibeQuery)
    const results = suggestions[category] ?? []
    return response(200, {
      category,
      suggestions: results,
      recommendedZone: results[0]?.zoneId ?? null,
      discount: results[0]?.discount ?? null,
    })
  } catch {
    return response(400, { error: 'Request body must be valid JSON' })
  }
}
