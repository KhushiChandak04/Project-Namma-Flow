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
  "discount": "10% demo offer"
}
```

Set `VITE_USE_MOCK_API=false` once API Gateway endpoints are ready.
