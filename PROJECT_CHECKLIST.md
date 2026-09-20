# Namma Flow — Master Checklist

`[x]` means verified in the repository; `[ ]` means pending or planned.

## PHASE 1 — FOUNDATION

- [x] Vite + React setup
- [x] Tailwind configuration
- [x] Shared repository structure
- [x] Frontend/backend split
- [x] Root `.env.example`
- [x] `.gitignore`

## PHASE 2 — DATA

- [x] `frontend/src/data/zones.js`
- [x] `frontend/src/data/routes.js`
- [x] `frontend/src/data/vibes.js`
- [x] Central data exports
- [x] Deterministic official demo responses

## PHASE 3 — HELPERS

- [x] Route lookup and fuzzy matching
- [x] Time-of-day detection
- [x] Congestion lookup
- [x] Departure recommendation
- [x] Travel-duration calculation
- [x] Vibe mapping
- [x] Congestion sorting

## PHASE 4 — TEAM INTEGRATION

- [x] Grid/Compass starter component interfaces
- [x] Leaflet map integration surfaces
- [x] Final Grid UI and map
- [x] Final Grid logic and `/trip-plan` integration
- [x] Final Compass UI and map
- [x] Final Compass logic and `/vibe-search` integration

## PHASE 5 — AWS

- [ ] Amplify deployment verified
- [ ] API Gateway configured
- [x] Lambda-compatible `/trip-plan` skeleton
- [x] Lambda-compatible `/vibe-search` skeleton
- [ ] Lambda deployed
- [ ] Bedrock integration verified
- [ ] DynamoDB caching (optional)

## PHASE 6 — FINAL

- [x] Smoke test
- [x] Production build
- [ ] Mobile testing
- [ ] End-to-end testing
- [ ] Demo scenario 1: Whitefield to Indiranagar
- [ ] Demo scenario 2: Indiranagar to Koramangala alternative
- [ ] Demo scenario 3: live music search
- [x] Architecture and team documentation
- [ ] Submission readiness
