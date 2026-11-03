import { describe, expect, it } from 'vitest'
import { getZoneCongestion, getDepartureRecommendation } from '../logic/congestion.js'
import { extractCategory } from '../logic/compassLogic.js'
import { getCompassResult } from '../services/compassService.js'
import { getBlendedCongestion } from '../services/feedbackService.js'
import { buildMetroRoute, findNearestStation } from '../services/transitService.js'
import { routes } from '../data/routes.js'

describe('Compass category extraction', () => {
  it('matches public park as a park query, not music', () => {
    expect(extractCategory('public park')).toBe('park')
  })

  it('matches great park as a park query, not restaurant', () => {
    expect(extractCategory('great park')).toBe('park')
  })

  it('does not match partial words as categories', () => {
    expect(extractCategory('public transport')).not.toBe('music')
  })
})

describe('congestion and departure logic', () => {
  it('uses the time-of-day congestion bucket', () => {
    const morning = new Date(2026, 8, 18, 8)
    const evening = new Date(2026, 8, 18, 19)
    expect(getZoneCongestion('indiranagar', morning)).toBe(64)
    expect(getZoneCongestion('indiranagar', evening)).toBe(88)
  })

  it('applies the shared departure thresholds', () => {
    const recommendation = getDepartureRecommendation(
      'Whitefield',
      'Indiranagar',
      new Date(2026, 8, 18, 19),
    )
    expect(recommendation.delayMinutes).toBe(20)
    expect(recommendation.congestion).toBe(88)
  })

  it.each([
    [0, 88, 'baseline'],
    [2, 88, 'baseline'],
    [5, 71, 'reports'],
    [12, 66, 'reports'],
  ])('blends congestion with %i reports', async (reportCount, expected, source) => {
    const reports = Array.from({ length: reportCount }, () => ({ rating: 3 }))
    await expect(getBlendedCongestion('indiranagar', 19, reports)).resolves.toEqual({
      congestion: expected,
      reportCount,
      source,
    })
  })
})

describe('Compass result contract', () => {
  it('returns the expected result shape', async () => {
    const result = await getCompassResult('')
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('category')
    expect(result).toHaveProperty('suggestions')
    expect(result).toHaveProperty('alternative')
    expect(result).toHaveProperty('discount')
    expect(result).toHaveProperty('message')
    expect(result).toHaveProperty('error')
    expect(typeof result.success).toBe('boolean')
    expect(Array.isArray(result.suggestions)).toBe(true)
    expect(typeof result.message).toBe('string')
  })

  describe('transit station routing', () => {
    const stations = [
      { id: 'a', name: 'Station A', coordinates: { lat: 12.95, lng: 77.60 } },
      { id: 'b', name: 'Station B', coordinates: { lat: 12.98, lng: 77.64 } },
    ]

    it('finds the nearest station', () => {
      expect(findNearestStation({ lat: 12.951, lng: 77.601 }, stations).station.id).toBe('a')
    })

    describe('demo route catalog', () => {
      it('contains every directed pair among the four zones', () => {
        const zones = ['Whitefield', 'Indiranagar', 'Koramangala', 'Varthur']
        for (const origin of zones) {
          for (const destination of zones) {
            if (origin !== destination) {
              expect(routes.some((route) => route.origin === origin && route.destination === destination)).toBe(true)
            }
          }
        }
      })
    })

    it('returns a walk-only estimate when both zones share the nearest station', () => {
      const route = buildMetroRoute(
        { name: 'Origin', coordinates: { lat: 12.951, lng: 77.601 } },
        { name: 'Destination', coordinates: { lat: 12.952, lng: 77.602 } },
        stations,
      )
      expect(route.segments).toHaveLength(1)
      expect(route.segments[0].mode).toBe('Walk')
    })
  })
})
