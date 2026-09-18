/**
 * Deterministic demo contracts for the three official hackathon journeys.
 * Every value here is simulated and must not be presented as live traffic data.
 */
export const mockResponses = {
  whitefieldToIndiranagar: {
    origin: 'Whitefield',
    destination: 'Indiranagar',
    route: [
      { mode: 'Bus', name: '306' },
      { mode: 'Metro', name: 'Purple Line' },
      { mode: 'Auto', name: 'Last Mile Auto' },
    ],
    departureRecommendation: 'Leave in 10 minutes',
    travelDuration: 62,
    congestion: 'HIGH',
    qrAvailable: true,
  },
  indiranagarAlternative: {
    currentZone: 'Indiranagar',
    congestion: 'HIGH',
    recommendedZone: 'Koramangala',
    discount: '10% off',
    reason: 'Lower congestion',
    suggestions: [
      { name: 'Demo Music Venue', category: 'music', zone: 'Koramangala', congestion: 'LOW', discount: '10% off' },
    ],
  },
  liveMusic: {
    vibeQuery: 'live music',
    category: 'music',
    recommendedZone: 'Koramangala',
    suggestions: [
      { name: 'Live Music District', category: 'music', zone: 'Koramangala', congestion: 'LOW', discount: '10% demo offer' },
      { name: 'Acoustic Nights Venue', category: 'music', zone: 'Varthur', congestion: 'MODERATE', discount: '15% demo offer' },
    ],
  },
}
