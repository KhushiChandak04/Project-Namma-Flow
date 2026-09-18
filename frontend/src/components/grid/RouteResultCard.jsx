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
      <p
        className="route-reveal-row py-4 text-sm font-bold"
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
