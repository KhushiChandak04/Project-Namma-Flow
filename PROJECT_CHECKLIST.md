# Project checklist

## Frontend

- [x] React/Vite frontend builds from the repository root.
- [x] Grid supports all four mock zones: Whitefield, Indiranagar, Koramangala, and Varthur.
- [x] Compass searches curated places and OpenStreetMap-backed place results.
- [x] Grid route planning works without the archived backend.
- [x] Metro station lookup is isolated in `frontend/src/services/transitService.js`.
- [x] Overpass station results are cached in memory and have a simulated-route fallback.
- [x] Bus durations and transit legs are disclosed as estimates.
- [x] Crowd congestion reports are optional and use Supabase when configured.
- [x] Supabase reads have a ten-minute in-memory cache.
- [x] Frontend tests cover category matching, congestion blending, departure thresholds, Compass results, and station routing.
- [x] Production build outputs to `frontend/dist`.

## Not implemented

- [ ] Live traffic or live congestion feeds.
- [ ] Live bus schedules.
- [ ] Live transit ticketing, payments, or authentication.
- [ ] Authenticated or abuse-resistant feedback submissions.
- [ ] Machine-learning congestion prediction.
- [ ] Archived AWS/Lambda backend deployment.
