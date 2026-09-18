import { useState } from "react";
import { getTripPlan } from "../services/tripService.js";
import GridSearchForm from "../components/grid/GridSearchForm.jsx";
import RouteResultCard from "../components/grid/RouteResultCard.jsx";
import GridMap from "../components/maps/GridMap.jsx";
import RevealHeadline from "../components/common/RevealHeadline.jsx";
import TransitShowcase from "../components/common/TransitShowcase.jsx";

export default function GridPage() {
  const [origin, setOrigin] = useState("Whitefield");
  const [destination, setDestination] = useState("Indiranagar");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  async function handleSearch(
    submittedOrigin = origin,
    submittedDestination = destination,
  ) {
    if (!submittedOrigin.trim() || !submittedDestination.trim()) {
      setError("Enter both an origin and destination.");
      return;
    }

    setOrigin(submittedOrigin);
    setDestination(submittedDestination);
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const simRain = searchParams.get('simRain') === 'true';
      
      const plan = await getTripPlan({
        origin: submittedOrigin,
        destination: submittedDestination,
        simRain
      });
      if (!plan.route)
        throw new Error("No demo route found for those locations.");
      setResult(plan);
      setStatus("success");
    } catch (requestError) {
      setResult(null);
      setError(requestError.message || "Unable to plan this trip.");
      setStatus("error");
    }
  }

  return (
    <section className="animate-stagger">
      <div className="grid items-center gap-8 pb-8 md:grid-cols-[minmax(0,1fr)_minmax(280px,.7fr)] lg:gap-12">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#E1432B]">
            01 / The Grid
          </p>
          <h2 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-6xl">
            <RevealHeadline>Move with the city,</RevealHeadline>
            <br />
            <span className="text-[#E1432B]">
              <RevealHeadline>not against it.</RevealHeadline>
            </span>
          </h2>
          <p className="mt-4 text-base font-bold leading-relaxed text-muted">
            A calmer route through Bangalore, stitched together from every mode
            that gets you there.
          </p>
        </div>
        <TransitShowcase />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
        <div className="border-2 border-ink bg-panel p-5 sm:p-7">
          <div className="mb-7 flex items-center justify-between">
            <h3 className="font-display text-xl font-extrabold">
              Plan your flow
            </h3>
            <span className="rounded-full bg-[#E1432B] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-panel">
              live demo
            </span>
          </div>
          <GridSearchForm
            onSearch={handleSearch}
            loading={status === "loading"}
          />
          {error && (
            <p className="mt-4 text-sm font-bold text-[#E1432B]" role="alert">
              {error}
            </p>
          )}
          <p className="mt-8 border-t border-dashed border-ink pt-4 text-xs font-bold leading-relaxed text-muted">
            Tip: try Whitefield → Indiranagar for the full multi-modal route
            demo.
          </p>
        </div>
        <div className="space-y-6">
          {result?.route ? (
            <RouteResultCard result={result} />
          ) : (
            <div className="flex min-h-[220px] items-center justify-center border-2 border-dashed border-ink bg-panel/60 p-8 text-center">
              <p className="max-w-xs font-display text-2xl font-extrabold">
                Your best route will appear here.
              </p>
            </div>
          )}
          <div
            id="grid-map-container"
            className="min-h-[340px] overflow-hidden rounded-[4px] border-2 border-ink bg-[#E9DFC7]"
          >
            <GridMap 
              origin={result?.route?.origin || origin} 
              destination={result?.route?.destination || destination}
              route={result?.route}
            />
          </div>
        </div>
      </div>
      
      {/* Toast Notification for simulated rain penalty */}
      {(result?.weather?.isRainingNow || new URLSearchParams(window.location.search).get('simRain') === 'true') && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#000000] text-panel px-6 py-3 rounded-full border border-ink shadow-lg font-bold text-sm flex items-center gap-3 animate-rise z-50">
          <span className="text-xl">🌧️</span>
          <span>Rain penalty applied! Congestion is spiking.</span>
        </div>
      )}
    </section>
  );
}
