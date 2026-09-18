import { useEffect, useRef, useState } from "react";
import { searchVibe } from "../services/vibeService.js";
import SuggestionCard from "../components/compass/SuggestionCard.jsx";
import { getCongestionForZone } from "../utils/helpers.js";
import { findZone, zones } from "../data/zones.js";
import RevealHeadline from "../components/common/RevealHeadline.jsx";
import { vibes } from "../data/vibes.js";
import CompassMap from "../components/maps/CompassMap.jsx";

const staticPlaces = Object.values(vibes).flat();
const categoryFilters = [
  ["Cafe", "cafe"],
  ["Live music", "music"],
  ["Park", "park"],
  ["Bookstore", "bookstore"],
];
const recommendedSearches = [
  "cozy cafe with good wifi",
  "live music tonight",
  "quiet park nearby",
  "bookstore in Koramangala",
];

export default function CompassPage() {
  const [query, setQuery] = useState("");
  const [currentZone, setCurrentZone] = useState("Indiranagar");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activePlace, setActivePlace] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = window.localStorage.getItem("namma-flow-recent-searches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const searchRequestRef = useRef(0);
  const searchInputRef = useRef(null);
  const searchSurfaceRef = useRef(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return undefined;

    function closeSearchOnOutsideClick(event) {
      if (!searchSurfaceRef.current?.contains(event.target))
        setSearchOpen(false);
    }

    document.addEventListener("pointerdown", closeSearchOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeSearchOnOutsideClick);
  }, [searchOpen]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!query.trim()) {
      setError("Describe what you want to find.");
      return;
    }
    const placeMatch = findZone(query);
    if (placeMatch) {
      setActivePlace(placeMatch.id);
      setActiveCategory("");
      setResult(null);
      setError("");
      setStatus("success");
      return;
    }
    setStatus("loading");
    setError("");
    
    const newSearches = [
      query.trim(),
      ...recentSearches.filter(
        (item) => item.toLowerCase() !== query.trim().toLowerCase(),
      ),
    ].slice(0, 5);
    setRecentSearches(newSearches);
    try {
      window.localStorage.setItem("namma-flow-recent-searches", JSON.stringify(newSearches));
    } catch (e) {
      // ignore quota errors
    }
    try {
      setActiveCategory("");
      setResult(
        await searchVibe({
          vibeQuery: query,
          currentZone,
          selectedZone: "all",
        }),
      );
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message || "Unable to search right now.");
      setStatus("error");
    }
  }

  const suggestions = (result?.suggestions ?? staticPlaces).filter(
    (suggestion) => {
      const matchesCategory =
        !activeCategory ||
        suggestion.category === activeCategory ||
        (activeCategory === "cafe" && suggestion.category === "cafes") ||
        (activeCategory === "park" && suggestion.category === "parks") ||
        (activeCategory === "bookstore" && suggestion.category === "bookstores");
      const matchesPlace =
        activePlace === "all" ||
        suggestion.zoneId === activePlace ||
        suggestion.zone?.toLowerCase() === activePlace ||
        suggestion.zone?.toLowerCase() === activePlace;
      return matchesCategory && matchesPlace;
    },
  );
  const displayZone = activePlace === "all" ? currentZone : activePlace;
  const currentCongestion = getCongestionForZone(displayZone);
  function chooseCategory(label, value) {
    setActiveCategory(value);
    setQuery(label);
    const requestId = ++searchRequestRef.current;
    setResult(null);
    setError("");
    setStatus("loading");
    searchVibe({ vibeQuery: value, currentZone, selectedZone: activePlace })
      .then((nextResult) => {
        if (requestId !== searchRequestRef.current) return;
        setResult(nextResult);
      })
      .catch((requestError) => {
        if (requestId !== searchRequestRef.current) return;
        setError(requestError.message || "Unable to search right now.");
      })
      .finally(() => {
        if (requestId === searchRequestRef.current) setStatus("success");
      });
  }
  function choosePlace(value) {
    const requestId = ++searchRequestRef.current;
    setActivePlace(value);
    if (activeCategory) {
      setResult(null);
      setError("");
      setStatus("loading");
      searchVibe({ vibeQuery: activeCategory, currentZone, selectedZone: value })
        .then((nextResult) => {
          if (requestId !== searchRequestRef.current) return;
          setResult(nextResult);
        })
        .catch((requestError) => {
          if (requestId !== searchRequestRef.current) return;
          setError(requestError.message || "Unable to search right now.");
        })
        .finally(() => {
          if (requestId === searchRequestRef.current) setStatus("success");
        });
    }
  }
  function focusSearch(event) {
    event.preventDefault();
    setSearchOpen(true);
    searchInputRef.current?.focus();
  }
  function chooseSearchSuggestion(value) {
    setQuery(value);
    setActiveCategory("");
    setError("");
    searchInputRef.current?.focus();
  }

  return (
    <section className="animate-stagger">
      <div className="mb-8 max-w-3xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#D9A400]">
          02 / The Compass
        </p>
        <h2 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-6xl">
          <RevealHeadline>Find your</RevealHeadline>{" "}
          <span className="text-[#D9A400]">
            <RevealHeadline>next feeling.</RevealHeadline>
          </span>
        </h2>
        <p className="mt-4 text-base font-bold leading-relaxed text-muted">
          A little less scrolling. A little more serendipity, routed around the
          city’s current load.
        </p>
      </div>
      {!searchOpen ? (
        <button
          className="action-button action-button-compass search-launcher"
          onClick={() => setSearchOpen(true)}
          type="button"
        >
          <span>Search</span>
          <span aria-hidden="true">⌕</span>
        </button>
      ) : (
        <form
          ref={searchSurfaceRef}
          className="relative search-form-open"
          onSubmit={handleSubmit}
        >
          <input
            ref={searchInputRef}
            className="field rounded-full py-4 pl-6 pr-32 text-base font-bold sm:text-lg"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveCategory("");
              setError("");
            }}
            placeholder="Search places, moods, or neighborhoods"
            aria-label="Search places or vibes"
          />
          <button
            className="action-button action-button-compass absolute right-1.5 top-1.5 w-auto gap-3 rounded-full px-5 py-2.5"
            disabled={status === "loading"}
            onMouseDown={focusSearch}
            type="submit"
          >
            {status === "loading" ? "Thinking…" : "Search"}
            <span aria-hidden="true">↗</span>
          </button>
          <div
            className="search-suggestions-panel"
            role="region"
            aria-label="Search suggestions"
          >
            <div className="search-panel-heading">
              {recentSearches.length
                ? "Recent searches"
                : "Recommended searches"}
            </div>
            {recentSearches.length
              ? recentSearches.map((item) => (
                  <button
                    key={item}
                    className="search-suggestion"
                    onClick={() => chooseSearchSuggestion(item)}
                    type="button"
                  >
                    <span className="search-suggestion-icon">↺</span>
                    {item}
                  </button>
                ))
              : recommendedSearches.map((item) => (
                  <button
                    key={item}
                    className="search-suggestion"
                    onClick={() => chooseSearchSuggestion(item)}
                    type="button"
                  >
                    <span className="search-suggestion-icon">⌕</span>
                    {item}
                  </button>
                ))}
            {recentSearches.length > 0 && (
              <>
                <div className="search-panel-heading search-panel-recommended">
                  Try something new
                </div>
                {recommendedSearches.slice(0, 3).map((item) => (
                  <button
                    key={item}
                    className="search-suggestion"
                    onClick={() => chooseSearchSuggestion(item)}
                    type="button"
                  >
                    <span className="search-suggestion-icon">✦</span>
                    {item}
                  </button>
                ))}
              </>
            )}
          </div>
        </form>
      )}
      <div
        className="mt-5 flex flex-wrap items-center gap-2"
      >
        <span className="mr-1 text-xs font-black uppercase tracking-[0.14em] text-muted">
          Vibe
        </span>
        {categoryFilters.map(([label, value]) => (
          <button
            key={value}
            type="button"
            onClick={() => chooseCategory(label, value)}
            className={`rounded-full border-2 border-ink px-4 py-2 text-xs font-extrabold transition-colors ${activeCategory === value ? "bg-ink text-panel" : "bg-panel hover:bg-[#FFC22E]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-black uppercase tracking-[0.14em] text-muted">
          Place
        </span>
        <button
          type="button"
          onClick={() => choosePlace("all")}
          className={`rounded-full border-2 border-ink px-4 py-2 text-xs font-extrabold transition-colors ${activePlace === "all" ? "bg-[#FFC22E]" : "bg-panel hover:bg-[#FFC22E]"}`}
        >
          All places
        </button>
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => choosePlace(zone.id)}
            className={`rounded-full border-2 border-ink px-4 py-2 text-xs font-extrabold transition-colors ${activePlace === zone.id ? "bg-[#FFC22E]" : "bg-panel hover:bg-[#FFC22E]"}`}
          >
            {zone.name}
          </button>
        ))}
      </div>
      <div className="mt-10 border-b-2 border-ink pb-4">
        <p className="font-display text-2xl font-extrabold">
          Suggestions for you
        </p>
        <p className="mt-1 text-sm font-semibold text-muted">
          Explore lower-load places across Bangalore ·{" "}
          <span className="font-mono-data">{currentCongestion}%</span> current
          demo load
        </p>
      </div>
      {error && (
        <p className="mt-5 font-bold text-[#E1432B]" role="alert">
          {error}
        </p>
      )}
      
      <div className="mt-8 mb-8 border-2 border-ink rounded-xl overflow-hidden bg-[#E9DFC7]">
        <CompassMap 
          recommendedZone={result?.verdict ? result.verdict.zone : currentZone}
          suggestions={suggestions}
          redirectSuggestions={result?.redirectSuggestions || []}
        />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {status === "loading" ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col justify-between rounded-[18px] border-2 border-ink bg-panel p-5 min-h-[160px]">
              <div>
                <div className="h-5 w-3/4 bg-[#E9DFC7] rounded"></div>
                <div className="h-3 w-1/2 bg-[#E9DFC7] rounded mt-2"></div>
              </div>
              <div className="h-6 w-16 bg-[#E9DFC7] rounded self-end mt-4"></div>
            </div>
          ))
        ) : suggestions.length === 0 ? (
          <p className="mt-8 text-sm font-bold text-muted col-span-full">
            No places match those filters yet. Try another neighborhood or vibe.
          </p>
        ) : (
          suggestions.map((suggestion) => {
            const zoneKey = suggestion.zoneId || suggestion.zone;
            const congestion = suggestion.congestionPercent ?? getCongestionForZone(zoneKey);
            return (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                congestion={congestion}
                zoneName={findZone(zoneKey)?.name || suggestion.zone}
                showDiscount={congestion < currentCongestion}
              />
            );
          })
        )}
      </div>
      {result?.verdict && (
        <div className="mt-8 rounded-[18px] border-2 border-ink bg-[#FFC22E] p-5">
          <p className="text-xs font-black uppercase tracking-[0.14em]">Compass verdict</p>
          <p className="mt-2 font-display text-xl font-black">{result.verdict.text}</p>
          {result.verdict.incentive && (
            <p className="mt-2 text-sm font-extrabold">Incentive: {result.verdict.incentive}</p>
          )}
        </div>
      )}
      {result?.redirectSuggestions?.length > 0 && (
        <>
          <div className="mt-8 border-b-2 border-ink pb-4">
            <p className="font-display text-2xl font-extrabold">
              Try {result.alternative?.name} instead
            </p>
            <p className="mt-1 text-sm font-semibold text-muted">
              Similar options with a lighter simulated traffic load.
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.redirectSuggestions.map((suggestion) => {
              const zoneKey = suggestion.zoneId || suggestion.zone;
              return (
                <SuggestionCard
                  key={`redirect-${suggestion.id}`}
                  suggestion={suggestion}
                  congestion={suggestion.congestionPercent}
                  zoneName={findZone(zoneKey)?.name || suggestion.zone}
                  showDiscount
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
