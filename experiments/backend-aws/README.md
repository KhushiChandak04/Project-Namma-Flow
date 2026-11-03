# Backend

This directory contains Lambda-compatible skeletons for the future API Gateway endpoints:

- `POST /trip-plan` uses deterministic demo route and congestion services.
- `POST /vibe-search` uses local keyword classification for the current demo contract.
- `backend/services/compassVibe.js` can use Hugging Face Inference API for structured vibe extraction.
- `backend/services/googlePlaces.js` can use Google Places API (New) Text Search for normalized Bangalore place results.
- `backend/services/trafficAwareness.js` can use Google Directions traffic estimates to enrich place results.
- `backend/services/userFeedback.js` stores 90-day feedback in DynamoDB and calculates user-report averages.

No Hugging Face token, live traffic feeds, or transit schedules are included. Deploy each Lambda with its handler directory and configure API Gateway CORS at deployment time.

For the optional Hugging Face parser, set `HF_TOKEN` in the Lambda environment variables and optionally set `HF_MODEL_ID`. Keep the token server-side; never use it in frontend `VITE_*` variables.

For Google Places, enable Places API (New) in Google Cloud, restrict the key to that API, and set `GOOGLE_PLACES_API_KEY` in the backend environment. Keep this key server-side as well.

For traffic awareness, enable the Directions API and set `GOOGLE_MAPS_API_KEY`, or reuse the Places key only if its API restrictions include Directions. Google Directions requires a billing-enabled Google Cloud project. Live traffic is disabled by default; set `ENABLE_LIVE_TRAFFIC=true` only after billing and API access are explicitly approved. Otherwise the service uses simulated traffic with no Google Directions requests.

For feedback persistence, create a DynamoDB table with partition key `feedbackId` (String), enable TTL on `expiresAt`, and add a GSI named `zone-time-index` with partition key `zoneTimeKey` (String) and sort key `submittedAt` (String). Set `FEEDBACK_TABLE_NAME` and give the Lambda role `dynamodb:PutItem`, `dynamodb:Query`, and `dynamodb:Scan` permissions. Without the table variable, feedback remains in memory for local development only.
