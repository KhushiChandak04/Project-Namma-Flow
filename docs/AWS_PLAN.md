# Namma Flow — AWS Plan

## Current status

Namma Flow is a static frontend with simulated data and pure frontend trip-planning logic. No AWS services are in use, and there is no live or deployed Lambda, API Gateway, Amplify, DynamoDB, or Bedrock integration.

The former AWS-compatible backend code is retained under `experiments/backend-aws/` for reference only. It is not imported by the frontend and is not part of the application runtime.

## Future work

Any cloud architecture is explicitly out of scope for the current MVP. If a future iteration adds hosted services, it must document and verify those integrations separately rather than treating the parked experiments as deployed infrastructure.

## Configuration

`.env.example` contains only browser-visible `VITE_*` configuration. Do not add credentials or backend-only secrets to frontend environment files.
