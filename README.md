# AI Content Empire (Web + Android Scaffold)

This repository now includes:
- **Web app prototype** (Vite + React + Tailwind classes)
- **Android starter scaffold** using React Native (Expo) under `mobile/`

## Web app

### Run
1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173`

### Build
- `npm run build`

## Android scaffold (`mobile/`)

The mobile folder contains an Expo starter with matching module navigation:
- Dashboard
- Research
- Studio
- Schedule
- Analytics
- Monitor
- WhatsApp

### Run mobile starter
1. `cd mobile`
2. `npm install`
3. `npm run android`

> Note: APK generation is done from the Expo/EAS pipeline in a real deployment setup.

## Implemented prototype features
- Research list generation with viral scores
- Content Studio tabs (script/voice/visuals/preview)
- Calendar scheduling form
- Analytics charts (line/bar/pie)
- Competitor monitor table
- WhatsApp/Twilio settings UI


## Optional API keys
- `VITE_GEMINI_API_KEY` for script generation
- `VITE_SERPAPI_KEY` for Google Trends-backed research

If these are missing, the app uses built-in prototype fallbacks.
