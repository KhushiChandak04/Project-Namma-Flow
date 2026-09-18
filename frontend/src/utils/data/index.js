/**
 * Namma Flow ZONES dataset for congestion and traffic analytics.
 * Includes demo zones with real-time (now) and time-of-day congestion metrics.
 */
export const ZONES = [
  {
    id: 'whitefield',
    name: 'Whitefield',
    type: 'commuter',
    congestion: {
      now: 76,
      morning: 82,
      daytime: 54,
      evening: 76,
    },
    coordinates: { lat: 12.9698, lng: 77.75 },
  },
  {
    id: 'indiranagar',
    name: 'Indiranagar',
    type: 'mixed',
    congestion: {
      now: 88,
      morning: 64,
      daytime: 58,
      evening: 88,
    },
    coordinates: { lat: 12.9784, lng: 77.6408 },
  },
  {
    id: 'koramangala',
    name: 'Koramangala',
    type: 'mixed',
    congestion: {
      now: 62,
      morning: 58,
      daytime: 62,
      evening: 79,
    },
    coordinates: { lat: 12.9352, lng: 77.6245 },
  },
  {
    id: 'varthur',
    name: 'Varthur',
    type: 'residential',
    congestion: {
      now: 42,
      morning: 71,
      daytime: 42,
      evening: 63,
    },
    coordinates: { lat: 12.9406, lng: 77.7468 },
  },
]

/**
 * Namma Flow VIBES dataset mapping vibe categories to search keywords and suggestions.
 */
export const VIBES = {
  cafes: {
    keywords: ['cafe', 'cafes', 'coffee', 'cozy', 'wifi', 'study', 'work'],
    suggestions: [
      { id: 'cafe-1', name: 'Cozy Cafe Cluster (80ft Road)', category: 'cafes', zone: 'Koramangala', discount: '10% demo offer' },
      { id: 'cafe-2', name: 'Quiet Cafe Corner (Greenwood)', category: 'cafes', zone: 'Varthur', discount: '15% demo offer' },
      { id: 'cafe-3', name: 'Work-Friendly Cafe (12th Main)', category: 'cafes', zone: 'Indiranagar', discount: null },
      { id: 'cafe-4', name: 'Windmills Craft & Artisan Cafe', category: 'cafes', zone: 'Whitefield', discount: null },
    ],
  },
  cafe: {
    keywords: ['cafe', 'coffee', 'cozy', 'wifi', 'study', 'work'],
    suggestions: [
      { id: 'cafe-1', name: 'Cozy Cafe Cluster (80ft Road)', category: 'cafe', zone: 'Koramangala', discount: '10% demo offer' },
      { id: 'cafe-2', name: 'Quiet Cafe Corner (Greenwood)', category: 'cafe', zone: 'Varthur', discount: '15% demo offer' },
      { id: 'cafe-3', name: 'Work-Friendly Cafe (12th Main)', category: 'cafe', zone: 'Indiranagar', discount: null },
      { id: 'cafe-4', name: 'Windmills Craft & Artisan Cafe', category: 'cafe', zone: 'Whitefield', discount: null },
    ],
  },
  music: {
    keywords: ['music', 'live music', 'concert', 'band', 'acoustic', 'gig', 'pub', 'nightlife'],
    suggestions: [
      { id: 'music-1', name: 'Live Music District (Fandom)', category: 'music', zone: 'Koramangala', discount: '10% demo offer' },
      { id: 'music-2', name: 'Acoustic Nights Open Stage', category: 'music', zone: 'Varthur', discount: '15% demo offer' },
      { id: 'music-3', name: 'Indiranagar Music Spot (Humming Tree)', category: 'music', zone: 'Indiranagar', discount: null },
      { id: 'music-4', name: 'Whitefield Jazz Club', category: 'music', zone: 'Whitefield', discount: null },
    ],
  },
  bookstores: {
    keywords: ['book', 'books', 'bookstore', 'bookstores', 'reading', 'literature', 'library'],
    suggestions: [
      { id: 'bookstore-1', name: 'Independent Bookstore & Cafe', category: 'bookstores', zone: 'Koramangala', discount: '10% demo offer' },
      { id: 'bookstore-2', name: 'Quiet Reading Hub & Library', category: 'bookstores', zone: 'Varthur', discount: '15% demo offer' },
      { id: 'bookstore-3', name: 'The Bookworm Indiranagar', category: 'bookstores', zone: 'Indiranagar', discount: null },
      { id: 'bookstore-4', name: 'Whitefield Readers Guild', category: 'bookstores', zone: 'Whitefield', discount: null },
    ],
  },
  bookstore: {
    keywords: ['book', 'books', 'bookstore', 'reading', 'literature', 'library'],
    suggestions: [
      { id: 'bookstore-1', name: 'Independent Bookstore & Cafe', category: 'bookstore', zone: 'Koramangala', discount: '10% demo offer' },
      { id: 'bookstore-2', name: 'Quiet Reading Hub & Library', category: 'bookstore', zone: 'Varthur', discount: '15% demo offer' },
      { id: 'bookstore-3', name: 'The Bookworm Indiranagar', category: 'bookstore', zone: 'Indiranagar', discount: null },
      { id: 'bookstore-4', name: 'Whitefield Readers Guild', category: 'bookstore', zone: 'Whitefield', discount: null },
    ],
  },
  parks: {
    keywords: ['park', 'parks', 'green', 'garden', 'walk', 'outdoor', 'nature', 'quiet park', 'peaceful'],
    suggestions: [
      { id: 'park-1', name: 'Quiet Green Space (Varthur Lake Walk)', category: 'parks', zone: 'Varthur', discount: '15% demo offer' },
      { id: 'park-2', name: 'City Park Area (Koramangala 4th Block)', category: 'parks', zone: 'Koramangala', discount: '10% demo offer' },
      { id: 'park-3', name: 'Defence Colony Peace Park', category: 'parks', zone: 'Indiranagar', discount: null },
      { id: 'park-4', name: 'Inner Circle Heritage Park', category: 'parks', zone: 'Whitefield', discount: null },
    ],
  },
  park: {
    keywords: ['park', 'green', 'garden', 'walk', 'outdoor', 'nature', 'quiet park', 'peaceful'],
    suggestions: [
      { id: 'park-1', name: 'Quiet Green Space (Varthur Lake Walk)', category: 'park', zone: 'Varthur', discount: '15% demo offer' },
      { id: 'park-2', name: 'City Park Area (Koramangala 4th Block)', category: 'park', zone: 'Koramangala', discount: '10% demo offer' },
      { id: 'park-3', name: 'Defence Colony Peace Park', category: 'park', zone: 'Indiranagar', discount: null },
      { id: 'park-4', name: 'Inner Circle Heritage Park', category: 'park', zone: 'Whitefield', discount: null },
    ],
  },
  restaurants: {
    keywords: ['restaurant', 'restaurants', 'family restaurant', 'dining', 'food', 'dinner', 'lunch', 'eat', 'eats', 'bistro'],
    suggestions: [
      { id: 'rest-1', name: 'Lakeside Family Retreat', category: 'restaurants', zone: 'Varthur', discount: '15% demo offer' },
      { id: 'rest-2', name: 'Garden Family Bistro', category: 'restaurants', zone: 'Koramangala', discount: '10% demo offer' },
      { id: 'rest-3', name: 'Heritage Family Dining (12th Main)', category: 'restaurants', zone: 'Indiranagar', discount: null },
      { id: 'rest-4', name: 'The Palms Courtyard Dining', category: 'restaurants', zone: 'Whitefield', discount: null },
    ],
  },
  restaurant: {
    keywords: ['restaurant', 'family restaurant', 'dining', 'food', 'dinner', 'lunch', 'eat', 'eats', 'bistro'],
    suggestions: [
      { id: 'rest-1', name: 'Lakeside Family Retreat', category: 'restaurant', zone: 'Varthur', discount: '15% demo offer' },
      { id: 'rest-2', name: 'Garden Family Bistro', category: 'restaurant', zone: 'Koramangala', discount: '10% demo offer' },
      { id: 'rest-3', name: 'Heritage Family Dining (12th Main)', category: 'restaurant', zone: 'Indiranagar', discount: null },
      { id: 'rest-4', name: 'The Palms Courtyard Dining', category: 'restaurant', zone: 'Whitefield', discount: null },
    ],
  },
}
