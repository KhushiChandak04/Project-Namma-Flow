# Service contracts

These services are intentionally small adapters between UI and backend logic.

## `tripService.js`

`getTripPlan({ origin, destination, currentTime })`

Expected backend response:

```json
{
  "route": {},
  "departureTime": {},
  "travelDuration": 42,
  "congestion": 71
}
```

## `vibeService.js`

`searchVibe({ vibeQuery, currentZone })`

Expected backend response:

```json
{
  "suggestions": [],
  "recommendedZone": "koramangala",
  "discount": "Concept: no transit partner yet."
}
```

Trip planning is implemented entirely in the frontend. The archived backend experiments under `experiments/backend-aws/` are not used by this service.
