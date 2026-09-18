import { useEffect, useRef, useState } from "react";
import { searchVibe } from "../services/vibeService.js";
import SuggestionCard from "../components/compass/SuggestionCard.jsx";
import { getCongestionForZone } from "../utils/helpers.js";
import { findZone, zones } from "../data/zones.js";
import RevealHeadline from "../components/common/RevealHeadline.jsx";
import { vibes } from "../data/vibes.js";

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
  const [recentSearches, setRecentSearches] = useState([]);
  const vibeFiltersRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchSurfaceRef = useRef(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function clearVibeSelection(event) {
      if (!activeCategory || vibeFiltersRef.current?.contains(event.target))
        return;

      setActiveCategory("");
      if (
        categoryFilters.some(
          ([label]) => label.toLowerCase() === query.toLowerCase(),
        )
      )
        setQuery("");
    }

    document.addEventListener("pointerdown", clearVibeSelection);
    return () =>
      document.removeEventListener("pointerdown", clearVibeSelection);
  }, [activeCategory, query]);

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
    setRecentSearches((previous) =>
      [
        query.trim(),
        ...previous.filter(
          (item) => item.toLowerCase() !== query.trim().toLowerCase(),
        ),
      ].slice(0, 4),
    );
    try {
      setActivePlace("all");
      setActiveCategory("");
      setResult(await searchVibe({ vibeQuery: query, currentZone }));
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message || "Unable to search right now.");
      setStatus("error");
    }
  }

  const suggestions = (result?.suggestions ?? staticPlaces).filter(
    (suggestion) => {
      const matchesCategory =
        !activeCategory || suggestion.category === activeCategory;
      const matchesPlace =
        activePlace === "all" || suggestion.zoneId === activePlace;
      return matchesCategory && matchesPlace;
    },
  );
  const currentCongestion = getCongestionForZone(currentZone);
  function chooseCategory(label, value) {
    setActiveCategory(value);
    setQuery(label);
    setResult(null);
  }
  function choosePlace(value) {
    setActivePlace(value);
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
        ref={vibeFiltersRef}
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
      {!suggestions.length && (
        <p className="mt-8 text-sm font-bold text-muted">
          No places match those filters yet. Try another neighborhood or vibe.
        </p>
      )}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((suggestion) => {
          const congestion = getCongestionForZone(suggestion.zoneId);
          return (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              congestion={congestion}
              zoneName={findZone(suggestion.zoneId)?.name}
              showDiscount={congestion < currentCongestion}
            />
          );
        })}
      </div>
    </section>
  );
}
