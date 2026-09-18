/**
 * Owner: Janhavi
 * Skeleton control. Styling can be replaced by the frontend owner.
 */
export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
      <button
        type="button"
        className={`rounded-md px-3 py-2 text-sm ${mode === 'grid' ? 'bg-slate-700' : 'text-slate-400'}`}
        onClick={() => onChange('grid')}
      >
        The Grid
      </button>
      <button
        type="button"
        className={`rounded-md px-3 py-2 text-sm ${mode === 'compass' ? 'bg-slate-700' : 'text-slate-400'}`}
        onClick={() => onChange('compass')}
      >
        The Compass
      </button>
    </div>
  )
}
