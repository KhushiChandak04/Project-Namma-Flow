// TODO: Khushi — configure the AWS integration boundary when deployment credentials and a model contract exist.
// Bedrock is intentionally not called until AWS credentials and a model contract exist.
export async function classifyVibe(query) {
  return { category: classifyLocally(query), source: 'local-demo' }
}

function classifyLocally(query) {
  const text = String(query ?? '').toLowerCase()
  if (/music|concert|band|gig|acoustic/.test(text)) return 'music'
  if (/book|reading|literature/.test(text)) return 'bookstore'
  if (/park|green|garden|walk|quiet outdoor/.test(text)) return 'park'
  if (/cafe|coffee|wifi|cozy|food/.test(text)) return 'cafe'
  return null
}
