# Namma Flow Tech Stack

## Implemented

- React 18 with JSX for the browser UI
- Vite 6 for development and production builds
- Tailwind CSS for styling
- Leaflet 1.9 with React Leaflet 4 for the reusable map surfaces
- JavaScript/Node.js for frontend services, smoke tests, and Lambda handlers
- AWS Amplify build configuration at the repository root

## Planned integrations

- API Gateway routes to the existing Lambda-compatible handlers
- Amazon Bedrock for Compass intent interpretation
- DynamoDB for optional caching
- Real traffic, transit, or place data providers when an approved API is available

No Python runtime is required by the current implementation. AWS Lambda supports Node.js here; Python should be introduced only if the team deliberately changes a backend function to Python.

## Deliberate constraints

The project does not include Next.js, hardware/IoT functionality, real payment or ticketing systems, native mobile code, or unverified live traffic claims.
