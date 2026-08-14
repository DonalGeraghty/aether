# Aether

A barebones home workout tracker built with React and Vite. The initial three-day program is based on the plan in the neighbouring Achilles project. Authentication uses the shared Janus API and the same Firestore-backed accounts as Nyx.

## Run locally

```bash
npm install
npm run dev
```

Workout drafts and completed sessions are stored per Janus account in the browser with `localStorage`. Set `VITE_JANUS_API_URL` to override the production Janus API URL during local API development.

In development, the login screen also offers an isolated demo account preloaded with sample workout history and a partially completed session. The demo is not included in production builds and does not write to Janus or Firestore.

The account page uses Janus's shared AI profile and encrypted credential endpoints. Signed-in users can connect OpenAI, Mistral, or Anthropic, choose an available model, remove provider keys, and delete their Janus account. Provider selections are account-wide and are therefore shared with Nyx.

## Cloud Run

The production container builds the Vite application and serves it with nginx on port `8080`, including SPA fallback and a `/health` endpoint.

```bash
gcloud run deploy aether \
  --source . \
  --project donal-geraghty-home \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080
```

### GitHub Actions deployment

The workflow at `.github/workflows/deploy-gcp.yml` validates the frontend, builds and pushes a SHA-tagged image to the `aether` Artifact Registry repository, deploys it to Cloud Run, and checks `/health` after every push to `main` or `master`. It can also be started manually with **Actions → Deploy Aether to Cloud Run → Run workflow**.

Configure this repository before the first workflow run:

- Repository secret `GCP_SA_KEY`: the Google Cloud service-account JSON used to deploy. GitHub secrets are repository-scoped, so add it to Aether even if Nyx already has a secret with the same name.
- Optional repository variable `VITE_JANUS_API_URL`: defaults to the current deployed Janus API URL when omitted.
- Optional GitHub environment `production`: create it if you want approval gates or environment-specific protections. The workflow will also use it without extra protection rules.

The Google Cloud deployment identity needs permission to create and push to the `aether` Artifact Registry repository, deploy and make the `aether` Cloud Run service public, and act as the service's runtime identity. The relevant predefined roles are Artifact Registry Administrator, Cloud Run Administrator, and Service Account User. The Artifact Registry and Cloud Run APIs must be enabled in `donal-geraghty-home` before the first run.
