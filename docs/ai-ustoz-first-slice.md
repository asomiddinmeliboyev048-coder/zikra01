# Zikra AI Ustoz — first implementation slice

## Product decisions
- Uzbek is the default explanation language.
- User chooses English, Russian, Programming, or Cybersecurity.
- Personality: warm, witty, supportive, and level-aware.
- Visual identity: animated silver orb/character named Ziyo.
- Mobile-first full-height chat experience.

## Implemented in this slice
- Authenticated server-side Responses API route at `/api/ai-tutor`.
- Track-specific Uzbek-first coaching instructions.
- Conversation context limited to the latest 14 messages.
- `store: false` on model requests; no conversation persistence yet.
- Client chat UI, track/level selection, browser speech input, device speech synthesis, and animated character.
- API key remains server-side.

## Required deployment configuration
Add `OPENAI_API_KEY` to Vercel Project → Settings → Environment Variables (Production and Preview as appropriate). Optional `ZIKRA_AI_MODEL` overrides the default model. Never use a `NEXT_PUBLIC_` prefix for the key.

## Voice limitations / next phase
This first slice uses browser speech recognition and the device's speech synthesis. Voice quality and Uzbek voice availability depend on the browser/OS. It is not yet a low-latency, full-duplex realtime voice conversation. The next phase should add an authenticated ephemeral-session endpoint and WebRTC connection to the Realtime API, plus server-side rate limits/usage controls and consent UI.

## Safety and privacy
- Only authenticated users can call the route.
- User input is length-limited and history is bounded.
- Model requests are not stored by the API (`store: false`).
- Add database persistence only after agreeing retention and deletion behavior.
