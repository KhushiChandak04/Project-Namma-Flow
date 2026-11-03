import { createClient } from '@supabase/supabase-js'
import { findZone } from '../data/zones.js'
import { getZoneCongestion } from '../logic/congestion.js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
const cache = new Map()
const CACHE_TTL_MS = 10 * 60 * 1000
const REPORT_WINDOW_DAYS = 90

function normalizeHour(hour) {
  const numericHour = Number(hour)
  return Number.isInteger(numericHour) && numericHour >= 0 && numericHour <= 23
    ? numericHour
    : new Date().getHours()
}

function baselineForHour(zoneId, hour) {
  const date = new Date()
  date.setHours(normalizeHour(hour), 0, 0, 0)
  return getZoneCongestion(zoneId, date)
}

export function blendCongestion(baseline, reports) {
  const validReports = (Array.isArray(reports) ? reports : [])
    .map((report) => Number(report?.rating))
    .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5)
  const reportCount = validReports.length

  if (reportCount < 3) {
    return { congestion: baseline, reportCount, source: 'baseline' }
  }

  const reportCongestion = (validReports.reduce((sum, rating) => sum + rating, 0) / reportCount) * 20
  const reportWeight = reportCount >= 10 ? 0.8 : 0.6
  const congestion = Math.round(reportCongestion * reportWeight + baseline * (1 - reportWeight))

  return {
    congestion,
    reportCount,
    source: 'reports',
  }
}

async function readReports(zoneId, hour) {
  if (!supabase) return null

  const key = `${zoneId}:${hour}`
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.reports

  const since = new Date()
  since.setDate(since.getDate() - REPORT_WINDOW_DAYS)
  const { data, error } = await supabase
    .from('congestion_reports')
    .select('rating, created_at')
    .eq('zone_id', zoneId)
    .eq('hour', hour)
    .gte('created_at', since.toISOString())

  if (error) {
    console.warn('Unable to read congestion reports:', error.message)
    return null
  }

  const reports = Array.isArray(data) ? data : []
  cache.set(key, { reports, expiresAt: Date.now() + CACHE_TTL_MS })
  return reports
}

export async function getBlendedCongestion(zoneId, hour = new Date().getHours(), reportsOverride) {
  const zone = findZone(zoneId)
  if (!zone) return null

  const normalizedHour = normalizeHour(hour)
  const reports = reportsOverride ?? await readReports(zone.id, normalizedHour)
  if (reports === null) return null

  return blendCongestion(baselineForHour(zone.id, normalizedHour), reports)
}

export async function submitCongestionReport({ zoneId, hour = new Date().getHours(), rating }) {
  if (!supabase) return null

  const zone = findZone(zoneId)
  const normalizedRating = Number(rating)
  if (
    !zone ||
    !Number.isInteger(normalizedRating) ||
    normalizedRating < 1 ||
    normalizedRating > 5
  ) {
    return { success: false, error: 'Invalid congestion report.' }
  }

  const normalizedHour = normalizeHour(hour)
  const { error } = await supabase.from('congestion_reports').insert({
    zone_id: zone.id,
    hour: normalizedHour,
    rating: normalizedRating,
  })

  if (error) {
    console.warn('Unable to submit congestion report:', error.message)
    return { success: false, error: error.message }
  }

  cache.delete(`${zone.id}:${normalizedHour}`)
  return { success: true }
}
