# Namma Flow — AWS Plan

## Current MVP

The frontend uses local simulated data so the team can build the Grid and Compass end-to-end before cloud integration.
The Vite application lives in `frontend/`; Amplify must build there and publish `frontend/dist`.

## Planned Ship It architecture

```text
Browser / PWA
    |
    v
AWS Amplify Hosting
    |
    +--------------------+
    |                    |
    v                    v
API Gateway          API Gateway
 /trip-plan           /vibe-search
    |                    |
    v                    v
Lambda               Lambda
    |                    |
    +-------> DynamoDB  |
                         v
                    Amazon Bedrock
```

## Service responsibilities

- Amplify Hosting: deploy the React/Vite frontend.
- API Gateway: public HTTP endpoints for backend calls.
- Lambda: serverless trip-planning and vibe-search handlers.
- DynamoDB: optional cache for zone/route/traffic data.
- Bedrock: natural-language vibe → structured category/intention for Compass.

## Secrets

Do not place AWS access keys in Vite environment variables. Browser-visible `VITE_*` variables are not secret. Use AWS IAM roles/profiles for local CLI work and Lambda execution roles for deployed functions.
