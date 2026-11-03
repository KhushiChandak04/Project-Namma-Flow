import 'dotenv/config'

const DEFAULT_VIBE = {
  primaryCategory: 'places',
  vibes: [],
  atmosphere: null,
  amenities: [],
  idealTime: null,
}

const MODEL_ID = process.env.HF_MODEL_ID || 'Qwen/Qwen2.5-7B-Instruct'
const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`

function getResponseText(response) {
  if (Array.isArray(response)) return response[0]?.generated_text?.trim()
  return response?.generated_text?.trim()
}

function parseJson(text) {
  if (!text) throw new Error('Hugging Face returned an empty response')

  const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]
  const jsonText = fencedJson || text.match(/\{[\s\S]*\}/)?.[0]
  if (!jsonText) throw new Error('Model response did not contain JSON')
  return JSON.parse(jsonText)
}

function normalizeVibe(value) {
  if (!value || typeof value !== 'object') throw new Error('Invalid vibe response')

  return {
    primaryCategory:
      typeof value.primaryCategory === 'string' && value.primaryCategory.trim()
        ? value.primaryCategory.trim().toLowerCase()
        : DEFAULT_VIBE.primaryCategory,
    vibes: Array.isArray(value.vibes) ? value.vibes.filter((item) => typeof item === 'string') : [],
    atmosphere: typeof value.atmosphere === 'string' ? value.atmosphere.trim().toLowerCase() || null : null,
    amenities: Array.isArray(value.amenities)
      ? value.amenities.filter((item) => typeof item === 'string')
      : [],
    idealTime: typeof value.idealTime === 'string' ? value.idealTime.trim() || null : null,
  }
}

export async function extractVibeFromQuery(userQuery) {
  if (typeof userQuery !== 'string' || !userQuery.trim()) return { ...DEFAULT_VIBE }

  const prompt = `You are a vibe analyst for Bangalore cafes and places.
User said: ${userQuery.trim()}
Extract the primary category (cafes/restaurants/parks/etc), specific vibes (cozy/loud/quiet/trendy/etc), amenities they want, atmosphere, and best time to visit.
Return JSON only with exactly these keys: primaryCategory, vibes, atmosphere, amenities, idealTime.
Use null for idealTime when the user did not specify a time. Use arrays for vibes and amenities.`

  if (!process.env.HF_TOKEN) return { ...DEFAULT_VIBE }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 256, temperature: 0.1, return_full_text: false },
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) throw new Error(`Hugging Face request failed with ${response.status}`)
    return normalizeVibe(parseJson(getResponseText(await response.json())))
  } catch {
    return { ...DEFAULT_VIBE }
  }
}