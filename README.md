# Aether

A barebones home workout tracker built with React and Vite. The initial three-day program is based on the plan in the neighbouring Achilles project. Authentication uses the shared Janus API and the same Firestore-backed accounts as Nyx.

## Run locally

```bash
npm install
npm run dev
```

Workout drafts and completed sessions are stored per Janus account in the browser with `localStorage`. Set `VITE_JANUS_API_URL` to override the production Janus API URL during local API development.
