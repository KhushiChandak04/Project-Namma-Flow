import { useState } from 'react'
import MapPlaceholder from '../components/maps/MapPlaceholder.jsx'
import { searchVibe } from '../services/vibeService.js'

export default function CompassPage() {
  const [query, setQuery] = useState('live music')
  const [currentZone, setCurrentZone] = useState('Indiranagar')
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!query.trim()) {
      setError('Describe what you want to find.')
      return
    }
    setStatus('loading')
    setError('')
    try {
      setResult(await searchVibe({ vibeQuery: query, currentZone }))
      setStatus('success')
    } catch (requestError) {
      setError(requestError.message || 'Unable to search right now.')
      setStatus('error')
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-violet-400">The Compass</p>
        <h2 className="mt-1 text-2xl font-semibold">Explorer mode</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Tell Compass what kind of evening you want. Suggestions are ranked with simulated congestion data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="font-medium">What are you in the mood for?</h3>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="cozy cafe, quiet park, live music" />
            <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={currentZone} onChange={(event) => setCurrentZone(event.target.value)}><option>Indiranagar</option><option>Koramangala</option><option>Whitefield</option><option>Varthur</option></select>
            <button className="w-full rounded-lg bg-violet-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50" disabled={status === 'loading'} type="submit">{status === 'loading' ? 'Searching...' : 'Explore'}</button>
          </form>
          {error && <p className="mt-3 text-sm text-rose-300" role="alert">{error}</p>}
          {result && !result.suggestions.length && <p className="mt-4 text-sm text-slate-400">No demo suggestions matched that vibe yet.</p>}
          {result?.suggestions.map((suggestion) => <div key={suggestion.id} className="mt-4 rounded-lg border border-slate-800 p-4"><div className="flex justify-between gap-3"><p className="font-medium">{suggestion.name}</p><span className="text-xs text-emerald-300">{suggestion.discount}</span></div><p className="mt-1 text-sm text-slate-400">Recommended zone: {suggestion.zoneId}</p></div>)}
          {result?.recommendedZone && <p className="mt-4 text-sm text-violet-200">Try {result.recommendedZone} for a lower-congestion alternative.</p>}
        </div>
        <MapPlaceholder title="Compass map — ready for suggestion markers" />
      </div>
    </section>
  )
}
