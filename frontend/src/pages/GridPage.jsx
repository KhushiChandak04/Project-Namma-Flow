import { useState } from 'react'
import GridMap from '../components/maps/GridMap.jsx'
import { zones } from '../data/zones.js'
import { getTripPlan } from '../services/tripService.js'

export default function GridPage() {
  const [origin, setOrigin] = useState('Whitefield')
  const [destination, setDestination] = useState('Indiranagar')
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!origin.trim() || !destination.trim()) {
      setError('Enter both an origin and destination.')
      return
    }

    setStatus('loading')
    setError('')
    try {
      const plan = await getTripPlan({ origin, destination })
      if (!plan.route) throw new Error('No demo route found for those locations.')
      setResult(plan)
      setStatus('success')
    } catch (requestError) {
      setResult(null)
      setError(requestError.message || 'Unable to plan this trip.')
      setStatus('error')
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-cyan-400">The Grid</p>
        <h2 className="mt-1 text-2xl font-semibold">Commuter mode</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Plan a calmer route using simulated congestion and multi-modal demo corridors.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="font-medium">Where are you going?</h3>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <label className="block text-sm text-slate-400">
              Origin
              <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Whitefield" />
            </label>
            <label className="block text-sm text-slate-400">
              Destination
              <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Indiranagar" />
            </label>
            <button className="w-full rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50" disabled={status === 'loading'} type="submit">
              {status === 'loading' ? 'Planning...' : 'Plan my trip'}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-rose-300" role="alert">{error}</p>}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {zones.map((zone) => <div key={zone.id} className="rounded-lg border border-slate-800 p-3"><p className="font-medium text-slate-200">{zone.name}</p><p className="mt-1 text-xs text-slate-500">Demo zone</p></div>)}
          </div>
        </div>
        <div className="space-y-4">
          {result && <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-sm text-cyan-300">{result.departureTime.label}</p><h3 className="mt-1 text-xl font-semibold">{result.travelDuration} min estimated</h3></div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{result.congestion}% demo congestion</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">{result.route.segments.map((segment) => <span key={`${segment.mode}-${segment.label}`} className="rounded-md border border-slate-700 px-3 py-2 text-sm">{segment.mode}</span>)}</div>
          </div>}
          <GridMap selectedZones={[origin.toLowerCase(), destination.toLowerCase()]} />
        </div>
      </div>
    </section>
  )
}
