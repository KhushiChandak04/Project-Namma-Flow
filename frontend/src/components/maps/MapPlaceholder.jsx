/**
 * Owner: Janhavi / Shravya depending on page.
 * Replace this component with Leaflet or MapLibre integration.
 */
export default function MapPlaceholder({ title = 'Map integration pending' }) {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center">
      <div>
        <p className="font-medium text-slate-200">{title}</p>
        <p className="mt-2 text-sm text-slate-500">
          Add the four Namma Flow zones, congestion colors, route highlighting, and suggestion markers here.
        </p>
      </div>
    </div>
  )
}
