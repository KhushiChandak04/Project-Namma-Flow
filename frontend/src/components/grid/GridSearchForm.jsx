import { useState } from "react";

export default function GridSearchForm({
  onSearch,
  initialOrigin = "Whitefield",
  initialDestination = "Indiranagar",
  loading = false,
}) {
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);

  function submit(event) {
    event.preventDefault();
    onSearch?.(origin, destination);
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <label className="block text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
        From
        <input
          className="field mt-2"
          value={origin}
          onChange={(event) => setOrigin(event.target.value)}
          placeholder="Whitefield"
        />
      </label>
      <label className="block text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
        To
        <input
          className="field mt-2"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          placeholder="Indiranagar"
        />
      </label>
      <button
        className="action-button action-button-grid"
        disabled={loading}
        onClick={() => onSearch?.(origin, destination)}
        type="button"
      >
        {loading ? "Finding a better way…" : "Find best route"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
