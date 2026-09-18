# Backend

This directory contains Lambda-compatible skeletons for the future API Gateway endpoints:

- `POST /trip-plan` uses deterministic demo route and congestion services.
- `POST /vibe-search` uses local keyword classification until Bedrock is configured.

No AWS credentials, live traffic feeds, transit schedules, or Bedrock calls are included. Deploy each Lambda with its handler directory and configure API Gateway CORS at deployment time.
