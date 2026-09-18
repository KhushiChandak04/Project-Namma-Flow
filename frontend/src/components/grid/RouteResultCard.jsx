const segmentColors = { Bus: "#E1432B", Metro: "#221B14", Auto: "#FFC22E" };

export default function RouteResultCard({ result }) {
  if (!result?.route) return null;

  const departureLabel = result.departureTime?.label || "Leave now";
  const countdown = departureLabel.match(/\d+/)?.[0] || "0";

  return (
    <article className="border-2 border-ink bg-panel p-5 sm:p-6">
      <div
        className="route-reveal-row flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-5"
        style={{ "--reveal-delay": "80ms" }}
      >
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted">
            Recommended departure
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-5xl font-black leading-none">
              {countdown}
            </span>
            <span className="font-display text-lg font-extrabold">
              min — {countdown === "0" ? "leave now" : "leave soon"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono-data text-2xl font-bold">
            {result.travelDuration}
            <span className="ml-1 text-sm">min</span>
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            estimated trip
          </p>
        </div>
      </div>
      <div className="route-reveal-row mt-4 mb-2 p-3 bg-[#E9DFC7] rounded-lg border-2 border-ink flex items-center justify-between" style={{ "--reveal-delay": "120ms" }}>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">Bangalore Chaos Score</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-display text-2xl font-black">{result.chaosScore || 0}/100</span>
            <span 
              className="cursor-help text-sm rounded-full bg-panel border border-ink px-2 py-0.5" 
              title={`Inputs:\n- Base Congestion: ${result.congestion}%\n- Rush Hour: ${result.isRushHour ? 'Yes' : 'No'}\n- Rain: ${result.weather?.isRainingNow ? 'Active' : result.weather?.rainExpected ? 'Expected' : 'Clear'}`}
            >
              ℹ️
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted font-bold">Past 3 hrs</p>
          {/* Simulated sparkline - strictly for demo visuals, not real history */}
          <div className="flex items-end gap-1 h-6 mt-1 opacity-60">
            <div className="w-2 bg-ink" style={{height: `${Math.max(10, (result.chaosScore || 50) - 20)}%`}}></div>
            <div className="w-2 bg-ink" style={{height: `${Math.max(10, (result.chaosScore || 50) - 10)}%`}}></div>
            <div className="w-2 bg-[#E1432B]" style={{height: `${result.chaosScore || 50}%`}}></div>
          </div>
        </div>
      </div>

      {(result.weather?.isRainingNow || result.weather?.rainExpected) && (
        <div className="route-reveal-row mb-4 p-3 bg-[#F2711C]/20 border border-[#F2711C] rounded-lg text-sm" style={{ "--reveal-delay": "180ms" }}>
          <strong>🌧️ Weather Impact:</strong> 
          <span className="ml-1">
            Without rain: {result.travelDurationNoRain} min. 
            With rain: {result.travelDuration} min 
            (+{Math.round(((result.travelDuration - result.travelDurationNoRain) / result.travelDurationNoRain) * 100)}%)
          </span>
        </div>
      )}

      <p
        className="route-reveal-row py-2 text-sm font-bold"
        style={{ "--reveal-delay": "220ms" }}
      >
        A mixed-mode route that keeps you moving through the city.
      </p>
      <div className="space-y-3">
        {result.route.segments.map((segment, index) => (
          <div
            key={`${segment.mode}-${segment.label}`}
            className="route-reveal-row flex items-center gap-3 border-l-4 py-1 pl-3"
            style={{
              borderColor: segmentColors[segment.mode] || "#221B14",
              "--reveal-delay": `${340 + index * 130}ms`,
            }}
          >
            <span className="font-mono-data text-xs font-bold text-muted">
              0{index + 1}
            </span>
            <span className="font-bold">{segment.label || segment.mode}</span>
            <span className="ml-auto text-xs font-extrabold uppercase tracking-wider text-muted">
              {segment.mode}
            </span>
          </div>
        ))}
      </div>
      <div
        className="route-reveal-row mt-5 flex items-center justify-between gap-4 border-t-2 border-dashed border-ink pt-4"
        style={{
          "--reveal-delay": `${340 + result.route.segments.length * 130 + 100}ms`,
        }}
      >
        <div>
          <p className="font-display text-sm font-extrabold">Your ride pass</p>
          <p className="text-xs text-muted">Scan at the interchange</p>
        </div>
        <div className="qr-placeholder" aria-label="QR code placeholder">
          <span>QR</span>
        </div>
      </div>
    </article>
  );
}
