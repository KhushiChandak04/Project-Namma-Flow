import 'dotenv/config'

import { randomUUID } from 'node:crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'

const FEEDBACK_TTL_DAYS = 90
const memoryStore = new Map()
const tableName = process.env.FEEDBACK_TABLE_NAME
const dynamo = tableName
  ? DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }))
  : null

function normalize(value) {
  return String(value ?? '').trim()
}

function timeLabel(time) {
  const match = normalize(time).match(/^(\d{1,2}):?(\d{2})$/)
  if (!match) return '00:00'
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`
}

function zoneTimeKey(zone, time) {
  return `${normalize(zone).toLowerCase()}#${timeLabel(time)}`
}

function numberInRange(value, minimum, maximum) {
  const number = Number(value)
  return Number.isFinite(number) && number >= minimum && number <= maximum
}

function validateFeedback(feedback) {
  if (!feedback || typeof feedback !== 'object') throw new Error('Feedback must be an object')
  for (const field of ['placeId', 'placeName', 'zone', 'visitTime']) {
    if (!normalize(feedback[field])) throw new Error(`${field} is required`)
  }
  for (const [field, minimum, maximum] of [
    ['actualCongestion', 0, 100],
    ['actualWaitTime', 0, 24 * 60],
    ['vibeAccuracy', 1, 5],
    ['wifi', 1, 5],
    ['quietness', 1, 5],
  ]) {
    if (!numberInRange(feedback[field], minimum, maximum)) {
      throw new Error(`${field} must be between ${minimum} and ${maximum}`)
    }
  }
}

function toItem(feedback) {
  const submittedAt = new Date().toISOString()
  const expiresAt = Math.floor(Date.now() / 1000) + FEEDBACK_TTL_DAYS * 24 * 60 * 60
  const zone = normalize(feedback.zone)
  const visitTime = timeLabel(feedback.visitTime)

  return {
    ...feedback,
    feedbackId: randomUUID(),
    placeId: normalize(feedback.placeId),
    placeName: normalize(feedback.placeName),
    zone,
    visitTime,
    actualCongestion: Number(feedback.actualCongestion),
    actualWaitTime: Number(feedback.actualWaitTime),
    vibeAccuracy: Number(feedback.vibeAccuracy),
    wifi: Number(feedback.wifi),
    quietness: Number(feedback.quietness),
    feedback: normalize(feedback.feedback),
    zoneTimeKey: zoneTimeKey(zone, visitTime),
    submittedAt,
    expiresAt,
  }
}

function putInMemory(item) {
  memoryStore.set(item.feedbackId, item)
  return item
}

async function queryZoneTime(zone, time) {
  const key = zoneTimeKey(zone, time)
  if (!dynamo) {
    const now = Math.floor(Date.now() / 1000)
    return [...memoryStore.values()].filter((item) => item.zoneTimeKey === key && item.expiresAt > now)
  }

  const response = await dynamo.send(new QueryCommand({
    TableName: tableName,
    IndexName: process.env.FEEDBACK_ZONE_TIME_INDEX || 'zone-time-index',
    KeyConditionExpression: 'zoneTimeKey = :zoneTimeKey',
    ExpressionAttributeValues: { ':zoneTimeKey': key },
  }))
  return response.Items || []
}

async function queryPlace(placeName) {
  if (!dynamo) {
    return [...memoryStore.values()].filter((item) => item.placeName.toLowerCase() === normalize(placeName).toLowerCase())
  }

  const response = await dynamo.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: 'placeName = :placeName',
    ExpressionAttributeValues: { ':placeName': normalize(placeName) },
  }))
  return response.Items || []
}

/** Stores feedback in DynamoDB, or in memory when FEEDBACK_TABLE_NAME is not configured. */
export async function submitFeedback(feedback) {
  validateFeedback(feedback)
  const item = toItem(feedback)

  if (!dynamo) return { ...putInMemory(item), storage: 'memory' }

  await dynamo.send(new PutCommand({ TableName: tableName, Item: item }))
  return { ...item, storage: 'dynamodb' }
}

/** Returns average reported congestion for a zone and exact visit-time bucket. */
export async function getHistoricalCongestion(zone, time) {
  if (!normalize(zone) || !normalize(time)) return { averageCongestion: null, reportCount: 0, confidence: 'No reports' }
  const items = await queryZoneTime(zone, time)
  const average = items.length > 0
    ? Math.round(items.reduce((total, item) => total + item.actualCongestion, 0) / items.length)
    : null

  return {
    zone: normalize(zone),
    time: timeLabel(time),
    averageCongestion: average,
    reportCount: items.length,
    confidence: items.length > 0 ? `Based on ${items.length} user report${items.length === 1 ? '' : 's'}, not just Google API` : 'No reports',
  }
}

/** Returns the average rating for a place and supported vibe field. */
export async function getVibeAccuracy(placeName, vibe) {
  const requestedVibe = normalize(vibe).toLowerCase()
  const field = { cozy: 'vibeAccuracy', vibe: 'vibeAccuracy', wifi: 'wifi', quietness: 'quietness', quiet: 'quietness' }[requestedVibe]
  if (!normalize(placeName) || !field) return { averageRating: null, reportCount: 0, confidence: 'No reports' }

  const items = await queryPlace(placeName)
  const values = items.map((item) => item[field]).filter((value) => Number.isFinite(value))
  const average = values.length > 0 ? Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10 : null

  return {
    placeName: normalize(placeName),
    vibe: requestedVibe,
    averageRating: average,
    reportCount: values.length,
    confidence: values.length > 0 ? `Based on ${values.length} user report${values.length === 1 ? '' : 's'}` : 'No reports',
  }
}