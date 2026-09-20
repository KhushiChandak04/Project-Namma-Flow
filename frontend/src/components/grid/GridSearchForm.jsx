import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function GridSearchForm({
  onSearch,
  initialOrigin = "Whitefield",
  initialDestination = "Indiranagar",
  loading = false,
}) {
  const location = useLocation();
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(location.state?.prefillDestination || initialDestination);

  useEffect(() => {
    if (location.state?.prefillDestination) {
      setDestination(location.state.prefillDestination);
    }
  }, [location.state]);

  function submit(event) {
    event.preventDefault();
    onSearch?.(origin, destination);
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <datalist id="zone-options">
        <option value="Whitefield" />
        <option value="Indiranagar" />
        <option value="Koramangala" />
        <option value="Varthur" />
      </datalist>
      <label className="block text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
        From
        <input
          className="field mt-2"
          list="zone-options"
          value={origin}
          onChange={(event) => setOrigin(event.target.value)}
          placeholder="Whitefield"
        />
      </label>
      <label className="block text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
        To
        <input
          className="field mt-2"
          list="zone-options"
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
