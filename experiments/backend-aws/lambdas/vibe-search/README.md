# Vibe search Lambda

API Gateway contract: `POST /vibe-search` with `vibeQuery` and optional `currentZone`. The existing handler still classifies known demo keywords locally and returns simulated suggestions.

The new `backend/services/compassVibe.js` service exposes `extractVibeFromQuery(userQuery)` for Hugging Face-backed structured vibe extraction. It is intentionally separate from the existing demo response contract.

## Hugging Face setup

1. Create a Hugging Face access token with Inference permissions at `huggingface.co/settings/tokens`.
2. Set the Lambda environment variable `HF_TOKEN` to that token.
3. Optionally set `HF_MODEL_ID`; the default is `Qwen/Qwen2.5-7B-Instruct`.
4. Deploy the Lambda with outbound HTTPS access.

For local calls, set `HF_TOKEN` in the shell before starting the backend. Do not commit the token or put it in frontend `VITE_*` variables. Without a token, model access, or a valid model response, the function returns a safe default object.
