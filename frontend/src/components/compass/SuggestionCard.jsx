const congestionStyles = {
  HIGH: "bg-[#E1432B] text-[#FBF6EA]",
  MODERATE: "bg-[#F2711C] text-[#FBF6EA]",
  LOW: "bg-[#D9A400] text-[#221B14]",
};

export default function SuggestionCard({
  suggestion,
  congestion,
  zoneName,
  showDiscount = false,
}) {
  if (!suggestion) return null;

  const level =
    congestion >= 75 ? "HIGH" : congestion >= 55 ? "MODERATE" : "LOW";
  const hasDiscount =
    showDiscount && (suggestion.discount || suggestion.discountLabel);

  return (
    <article className="group relative overflow-hidden rounded-[18px] border-2 border-ink bg-panel transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#E1432B] hover:shadow-[4px_4px_0_#221B14]">
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#E1432B] via-[#F2711C] to-[#FFC22E] p-4">
        <div className="absolute -right-5 -top-10 h-32 w-32 rounded-full border-[18px] border-[#FBF6EA]/25 transition-transform duration-500 group-hover:rotate-12" />
        <span className="relative rounded-full border-2 border-ink bg-panel px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em]">
          {suggestion.category || "place"}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-black leading-tight">
            {suggestion.name}
          </h3>
          <span
            className="translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
            aria-hidden="true"
          >
            ↗
          </span>
          {hasDiscount && (
            <span className="shrink-0 rounded-full bg-ink px-2 py-1 text-[10px] font-extrabold text-panel">
              10% off
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-ink px-2.5 py-1 text-xs font-bold">
            {zoneName || suggestion.zoneId}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${congestionStyles[level]}`}
          >
            {level.toLowerCase()} load
          </span>
        </div>
      </div>
    </article>
  );
}
