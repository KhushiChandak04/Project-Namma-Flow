# Namma Flow

Namma Flow is a software-only Progressive Web App concept for Bangalore that helps distribute urban travel load instead of only reporting congestion.

## Product

- **The Grid:** commuter planning from origin and destination to a demo multi-modal route, congestion-aware departure recommendation, and duration.
- **The Compass:** explorer search such as `cozy cafe`, `quiet park`, or `live music`, ranked toward lower-congestion demo zones.

All traffic values, destinations, routes, discounts, and schedules in the MVP are simulated. The app does not claim live BMTC, metro, traffic, payment, ticketing, dispatch, or authentication integrations.

## Repository layout

```text
frontend/                 React/Vite/Tailwind application
  src/components/         Shared shell and feature UI boundaries
  src/pages/              Grid and Compass pages
  src/data/                Demo zones, routes, and vibes
  src/services/            API, trip, and vibe adapters
  src/utils/               Shared deterministic helpers
backend/                  Lambda-compatible API skeletons
  lambdas/trip-plan/       POST /trip-plan
  lambdas/vibe-search/     POST /vibe-search
  services/                Backend-safe demo route/traffic/AI adapters
docs/                     Architecture and team contracts
scripts/                  Repository smoke tests
```

The frontend includes Leaflet map surfaces in `frontend/src/components/maps/`. `frontend/src/data/mockResponses.js` contains deterministic, clearly simulated contracts for the three demo journeys. See [docs/TECH_STACK.md](docs/TECH_STACK.md) for implemented versus planned technologies.

## Local setup

Requirements: Node.js and npm.

```bash
copy .env.example frontend\.env.local
npm install
npm run dev
```

For PowerShell, `Copy-Item .env.example frontend\.env.local` is equivalent to `copy`.

Run those commands from the repository root. The root `package.json` is the team entry point and delegates commands to `frontend/`. Do not start Vite with a path-prefixed npm command; use the root script so Vite receives the frontend workspace as its working directory.

The direct frontend equivalent is:

```bash
cd frontend
npm install
npm run dev
```

Frontend environment variables are browser-visible and must never contain AWS secrets:

```env
VITE_API_BASE_URL=
VITE_USE_MOCK_API=true
```

Keep `VITE_USE_MOCK_API=true` for the local deterministic MVP. Set it to `false` only when `VITE_API_BASE_URL` points to a deployed API Gateway stage.

## Verification

From the repository root:

```bash
npm run smoke
npm run build
```

The smoke test imports the shared data/helpers and verifies the demo journeys' core contracts. The production build outputs to `frontend/dist`.

If the browser is blank, confirm the terminal says `Local: http://localhost:5173/`, open that exact URL, and restart with `npm run dev` from the repository root. A Vite process started from the wrong directory can serve a 404 instead of the app.

## AWS architecture

Amplify Hosting serves the frontend. The planned backend path is API Gateway to Lambda for `/trip-plan` and `/vibe-search`, with optional DynamoDB caching and Bedrock for Compass intent interpretation. Only the frontend MVP and local Lambda-compatible skeletons are implemented today; deployment and live integrations remain planned. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Team ownership

This is one shared repository with feature branches and pull requests, not four isolated projects. Khushi owns setup/data/AWS foundation; Janhavi owns shell/Grid UI/maps; Titiksha owns Grid logic and trip integration; Shravya owns Compass/vibe search/Bedrock integration. See [docs/TEAM_CONTRACTS.md](docs/TEAM_CONTRACTS.md).

## Current limitations and next work

The map remains a replaceable placeholder, backend handlers are not deployed, traffic and transit data are simulated, and Bedrock is not called. Future work should add real providers behind the existing service contracts, then verify API Gateway, Amplify, and any DynamoDB usage before describing them as live.
