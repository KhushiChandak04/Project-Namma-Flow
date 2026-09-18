# Namma Flow — Team Contracts

## Shared repository rule

Everyone works in this repository. Do not create separate project repositories for individual features.

Recommended feature branches:

- `feat/janhavi-grid-ui`
- `feat/titiksha-grid-logic`
- `feat/shravya-compass`
- `feat/khushi-aws-data`

Merge to `main` only after the branch runs `npm run build` and `npm run smoke` from the repository root.

## Ownership

### Khushi — Project Setup + AWS Foundation
- Vite + React setup
- Tailwind configuration
- Repository structure
- Amplify deployment configuration
- Zones, routes, vibes data
- Shared utility/helper functions
- Lambda/API Gateway skeletons
- AWS integration preparation

### Janhavi — Frontend Shell + Grid UI
- App shell
- Mode switch
- Grid inputs and result card
- QR UI
- Grid map
- Frontend styling

### Titiksha — Grid Logic + Integrations
- Route matching behavior
- Departure-time behavior
- Travel duration behavior
- Fuzzy matching refinement
- `/trip-plan` Lambda
- API Gateway integration
- DynamoDB caching if time permits

### Shravya — Compass Logic + Feature Integration
- Compass UI
- Vibe search behavior
- Congestion-aware suggestion ranking
- Compass map
- `/vibe-search` Lambda
- Bedrock integration
- Demo scenarios/story

## Data contracts

### Zones
Each zone has:

- `id`
- `name`
- `type`
- `congestion.morning`
- `congestion.daytime`
- `congestion.evening`
- `coordinates`

### Routes
Each route has:

- `id`
- `origin`
- `destination`
- `segments[]`
- `baseDurationMinutes`

### Vibes
Each suggestion has:

- `id`
- `name`
- `category`
- `zoneId`
- `discount`

## Backend contracts

### `POST /trip-plan`
Request:

```json
{
  "origin": "Whitefield",
  "destination": "Indiranagar",
  "currentTime": "2026-09-18T08:00:00+05:30"
}
```

Response:

```json
{
  "route": {},
  "departureTime": {},
  "travelDuration": 64,
  "congestion": 64
}
```

### `POST /vibe-search`
Request:

```json
{
  "vibeQuery": "cozy cafe with good wifi",
  "currentZone": "indiranagar"
}
```

Response:

```json
{
  "suggestions": [],
  "recommendedZone": "koramangala",
  "discount": "10% demo offer"
}
```
