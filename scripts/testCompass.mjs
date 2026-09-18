/**
 * Namma Flow — Compass Backend Logic & Service Test Suite
 *
 * Usage:
 *   node scripts/testCompass.mjs
 *   node scripts/testCompass.mjs --verbose
 */

import assert from 'node:assert/strict'
import {
  extractCategory,
  getSuggestionsForCategory,
  rankByCongestion,
  enrichSuggestionsWithCongestion,
  getAlternativeZone,
  getDiscountForAlternative,
} from '../src/logic/compassLogic.js'
import { getCompassResult } from '../src/services/compassService.js'

const isVerbose = process.argv.includes('--verbose') || process.env.DEBUG === '1'

let totalTests = 0
let passedTests = 0
let failedTests = 0
const failures = []

function logHeader(title) {
  console.log('\n' + '='.repeat(60))
  console.log(`  ${title}`)
  console.log('='.repeat(60))
}

function runTest(testName, testFn) {
  totalTests += 1
  try {
    testFn()
    passedTests += 1
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${testName}`)
  } catch (error) {
    failedTests += 1
    failures.push({ name: testName, error })
    console.log(`  \x1b[31m✖ [FAIL]\x1b[0m ${testName}`)
    console.log(`    \x1b[33mError:\x1b[0m ${error.message}`)
    if (isVerbose && error.stack) {
      console.log(`    \x1b[90m${error.stack}\x1b[0m`)
    }
  }
}

async function runAsyncTest(testName, testFn) {
  totalTests += 1
  try {
    await testFn()
    passedTests += 1
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${testName}`)
  } catch (error) {
    failedTests += 1
    failures.push({ name: testName, error })
    console.log(`  \x1b[31m✖ [FAIL]\x1b[0m ${testName}`)
    console.log(`    \x1b[33mError:\x1b[0m ${error.message}`)
    if (isVerbose && error.stack) {
      console.log(`    \x1b[90m${error.stack}\x1b[0m`)
    }
  }
}

async function main() {
  const startTime = Date.now()
  console.log('\x1b[1m\x1b[36mRunning Namma Flow Compass Backend Test Suite...\x1b[0m')

  // ==========================================
  // SUITE 1: compassLogic.js Pure Functions
  // ==========================================
  logHeader('SUITE 1: compassLogic.js Pure Functions')

  runTest('extractCategory: matches single keyword in user query', () => {
    const category = extractCategory('cozy cafe with good wifi')
    assert.equal(category, 'cafes', `Expected 'cafes', got '${category}'`)
  })

  runTest('extractCategory: case-insensitive match (e.g. UPPERCASE)', () => {
    const category = extractCategory('LOOKING FOR LIVE MUSIC TONIGHT')
    assert.equal(category, 'music', `Expected 'music', got '${category}'`)
  })

  runTest('extractCategory: returns null when no keyword matches', () => {
    const category = extractCategory('something completely irrelevant 12345')
    assert.equal(category, null, `Expected null, got '${category}'`)
  })

  runTest('extractCategory: handles null, undefined, and non-string inputs safely', () => {
    assert.equal(extractCategory(null), null)
    assert.equal(extractCategory(undefined), null)
    assert.equal(extractCategory(123), null)
    assert.equal(extractCategory(''), null)
  })

  runTest('getSuggestionsForCategory: returns suggestions for valid category', () => {
    const suggestions = getSuggestionsForCategory('cafes')
    assert.ok(Array.isArray(suggestions), 'Result must be an array')
    assert.ok(suggestions.length > 0, 'Should have at least 1 cafe suggestion')
    assert.ok(suggestions[0].name, 'Suggestion must have a name')
  })

  runTest('getSuggestionsForCategory: returns empty array for nonexistent category', () => {
    const suggestions = getSuggestionsForCategory('nonexistent-category')
    assert.ok(Array.isArray(suggestions), 'Result must be an array')
    assert.equal(suggestions.length, 0, 'Should return empty array')
  })

  runTest('rankByCongestion: sorts suggestions by congestion ASCENDING without mutating original', () => {
    const input = [
      { name: 'Indy Cafe', zone: 'Indiranagar' },   // 88%
      { name: 'Varthur Cafe', zone: 'Varthur' },    // 42%
      { name: 'Kora Cafe', zone: 'Koramangala' },   // 62%
      { name: 'Whitefield Cafe', zone: 'Whitefield' } // 76%
    ]

    const inputCopy = JSON.parse(JSON.stringify(input))
    const ranked = rankByCongestion(input)

    assert.equal(ranked.length, 4)
    assert.equal(ranked[0].zone, 'Varthur', 'Least congested should be first (42%)')
    assert.equal(ranked[1].zone, 'Koramangala', 'Second should be Koramangala (62%)')
    assert.equal(ranked[2].zone, 'Whitefield', 'Third should be Whitefield (76%)')
    assert.equal(ranked[3].zone, 'Indiranagar', 'Most congested should be last (88%)')

    // Verify immutability
    assert.deepEqual(input, inputCopy, 'Original suggestions array must NOT be mutated')
  })

  runTest('enrichSuggestionsWithCongestion: adds congestionPercent, congestionColor, and congestionLabel', () => {
    const sample = [
      { name: 'Indiranagar Spot', zone: 'Indiranagar' },
      { name: 'Varthur Spot', zone: 'Varthur' }
    ]

    const enriched = enrichSuggestionsWithCongestion(sample)
    assert.equal(enriched.length, 2)

    const indy = enriched.find((s) => s.zone === 'Indiranagar')
    assert.equal(indy.congestionPercent, 88)
    assert.equal(indy.congestionColor, 'red', 'Indiranagar (88%) should map to red')
    assert.equal(indy.congestionLabel, 'Very High')

    const varthur = enriched.find((s) => s.zone === 'Varthur')
    assert.equal(varthur.congestionPercent, 42)
    assert.equal(varthur.congestionColor, 'yellow', 'Varthur (42%) should map to yellow')
    assert.equal(varthur.congestionLabel, 'Moderate')
  })

  runTest('getAlternativeZone: returns zone with lowest congestion when current zone >= 70%', () => {
    // Indiranagar has 88% congestion (>= 70%)
    const alt = getAlternativeZone('Indiranagar')
    assert.ok(alt, 'Should recommend an alternative for Indiranagar')
    assert.equal(alt.name, 'Varthur', 'Varthur has the lowest congestion (42%)')
    assert.notEqual(alt.name, 'Indiranagar', 'Alternative must be a different zone')
  })

  runTest('getAlternativeZone: returns null when current zone < 70%', () => {
    // Varthur has 42% congestion (< 70%)
    const alt = getAlternativeZone('Varthur')
    assert.equal(alt, null, 'No alternative needed when zone traffic is < 70%')

    // Koramangala has 62% congestion (< 70%)
    const altKora = getAlternativeZone('Koramangala')
    assert.equal(altKora, null, 'No alternative needed for Koramangala')
  })

  runTest('getDiscountForAlternative: returns tiered discount based on congestion difference', () => {
    // Diff > 40: Indiranagar (88) - Varthur (42) = 46 -> 20% Metro discount
    const discount40 = getDiscountForAlternative('Indiranagar', 'Varthur')
    assert.deepEqual(discount40, { percentage: 20, text: '20% Metro discount' })

    // Diff > 25: Indiranagar (88) - Koramangala (62) = 26 -> 15% Auto discount
    const discount25 = getDiscountForAlternative('Indiranagar', 'Koramangala')
    assert.deepEqual(discount25, { percentage: 15, text: '15% Auto discount' })

    // Diff > 10: Whitefield (76) - Koramangala (62) = 14 -> 10% ride discount
    const discount10 = getDiscountForAlternative('Whitefield', 'Koramangala')
    assert.deepEqual(discount10, { percentage: 10, text: '10% ride discount' })

    // Diff <= 10: Varthur (42) - Indiranagar (88) = -46 -> null
    const noDiscount = getDiscountForAlternative('Varthur', 'Indiranagar')
    assert.equal(noDiscount, null)
  })

  // ==========================================
  // SUITE 2: compassService.js getCompassResult
  // ==========================================
  logHeader('SUITE 2: compassService.js getCompassResult')

  await runAsyncTest('getCompassResult: rejects empty or whitespace vibeQuery', async () => {
    const res1 = await getCompassResult('')
    assert.equal(res1.success, false)
    assert.equal(res1.error, 'Please enter a vibe')
    assert.deepEqual(res1.suggestions, [])

    const res2 = await getCompassResult('   ')
    assert.equal(res2.success, false)
    assert.equal(res2.error, 'Please enter a vibe')
  })

  await runAsyncTest('getCompassResult: handles query with no matching category', async () => {
    const res = await getCompassResult('spaceships orbiting saturn')
    assert.equal(res.success, false)
    assert.equal(res.error, 'No suggestions found for "spaceships orbiting saturn"')
    assert.deepEqual(res.suggestions, [])
  })

  await runAsyncTest('getCompassResult: successfully returns top 3 suggestions without currentZone', async () => {
    const res = await getCompassResult('cozy cafe')
    assert.equal(res.success, true)
    assert.equal(res.category, 'cafes')
    assert.equal(res.error, null)
    assert.ok(res.suggestions.length <= 3, 'Suggestions must be capped at 3')
    assert.equal(res.suggestions.length, 3)
    assert.equal(res.alternative, null)
    assert.equal(res.discount, null)
    assert.equal(res.message, 'Found 3 cafes nearby')

    // Validate fields on enriched suggestion
    const first = res.suggestions[0]
    assert.ok(first.name)
    assert.ok(typeof first.congestionPercent === 'number')
    assert.ok(['red', 'orange', 'yellow', 'green'].includes(first.congestionColor))
    assert.ok(first.congestionLabel)

    if (isVerbose) {
      console.log('    \x1b[90mSample suggestion:\x1b[0m', JSON.stringify(first))
    }
  })

  await runAsyncTest('getCompassResult: handles congested currentZone and produces alternative + discount', async () => {
    const res = await getCompassResult('cozy cafe', 'Indiranagar')
    assert.equal(res.success, true)
    assert.ok(res.alternative, 'Alternative must be provided for congested Indiranagar')
    assert.equal(res.alternative.name, 'Varthur')
    assert.equal(res.alternative.congestion, 42)
    assert.equal(res.alternative.congestionColor, 'yellow')

    assert.ok(res.discount, 'Discount must be provided')
    assert.equal(res.discount.percentage, 20)
    assert.equal(res.discount.text, '20% Metro discount')

    assert.equal(res.message, 'Indiranagar is busy! Try Varthur instead.')

    if (isVerbose) {
      console.log('    \x1b[90mResult payload:\x1b[0m', JSON.stringify({
        category: res.category,
        alternative: res.alternative,
        discount: res.discount,
        message: res.message
      }, null, 2))
    }
  })

  await runAsyncTest('getCompassResult: handles free-flowing currentZone without triggering alternative', async () => {
    const res = await getCompassResult('cozy cafe', 'Varthur')
    assert.equal(res.success, true)
    assert.equal(res.alternative, null, 'Varthur congestion is low, no alternative should be triggered')
    assert.equal(res.discount, null)
    assert.equal(res.message, 'Found 3 cafes nearby')
  })

  // ==========================================
  // SUMMARY
  // ==========================================
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log('\n' + '='.repeat(60))
  console.log(`  TEST RESULTS: ${passedTests}/${totalTests} Passed (${duration}s)`)
  console.log('='.repeat(60))

  if (failedTests > 0) {
    console.log(`\n\x1b[31mFAILURES (${failedTests}):\x1b[0m`)
    failures.forEach((f, idx) => {
      console.log(`  ${idx + 1}) ${f.name}`)
      console.log(`     ${f.error.message}`)
    })
    console.log('\n\x1b[31mSome tests failed. Check the errors above for debugging.\x1b[0m\n')
    process.exit(1)
  } else {
    console.log('\n\x1b[32m✔ All Compass backend tests passed successfully!\x1b[0m\n')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Fatal error during test run:', err)
  process.exit(1)
})
