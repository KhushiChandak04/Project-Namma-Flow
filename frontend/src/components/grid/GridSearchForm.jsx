import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const zones = ["Whitefield", "Indiranagar", "Koramangala", "Varthur"];

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
    <form className="grid-route-form" onSubmit={submit}>
      <div className="grid-route-fields">
        <label className="grid-route-field">
          <span className="grid-route-label">
            <span className="grid-route-dot grid-route-dot-start" />
            From
          </span>
          <span className="grid-route-select">
            <select
              className="field"
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              aria-label="Starting location"
            >
              {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
            <span className="grid-route-chevron" aria-hidden="true">⌄</span>
          </span>
        </label>
        <div className="grid-route-connector" aria-hidden="true" />
        <label className="grid-route-field">
          <span className="grid-route-label">
            <span className="grid-route-dot grid-route-dot-end" />
            To
          </span>
          <span className="grid-route-select">
            <select
              className="field"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              aria-label="Destination"
            >
              {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
            <span className="grid-route-chevron" aria-hidden="true">⌄</span>
          </span>
        </label>
      </div>
      <button
        className="action-button action-button-grid grid-route-submit"
        disabled={loading}
        type="submit"
      >
        {loading ? "Finding a better way…" : "Find best route"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
