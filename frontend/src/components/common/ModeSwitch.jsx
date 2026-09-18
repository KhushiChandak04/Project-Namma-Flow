const modeCopy = {
  grid: { label: "Grid", hint: "commute" },
  compass: { label: "Compass", hint: "explore" },
};

export default function ModeSwitch({ mode = "grid", onChange }) {
  const active = modeCopy[mode] ?? modeCopy.grid;

  return (
    <div
      className="flex items-center gap-3"
      aria-label="Choose Namma Flow mode"
    >
      <span className="hidden text-right text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted sm:block">
        {active.hint}
        <br />
        mode
      </span>
      <div className="mode-switch" role="group" aria-label="Mode switch">
        <div className="mode-rail" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <button
          type="button"
          className={`mode-lever ${mode === "compass" ? "mode-lever-compass" : ""}`}
          onClick={() => onChange?.(mode === "grid" ? "compass" : "grid")}
          aria-label={`Switch to ${mode === "grid" ? "Compass" : "Grid"} mode`}
          aria-pressed={mode === "compass"}
        >
          <span className="mode-lever-grip" />
        </button>
      </div>
      <div className="min-w-[68px]">
        <p className="font-display text-sm font-black leading-none">
          {active.label}
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
          {mode === "grid" ? "routes" : "vibes"}
        </p>
      </div>
    </div>
  );
}
