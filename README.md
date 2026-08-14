# Aether

A barebones home workout tracker built with React and Vite. The initial three-day program is based on the plan in the neighbouring Achilles project. Authentication uses the shared Janus API and the same Firestore-backed accounts as Nyx.

## Run locally

Aether uses Node.js 24 LTS. With `nvm` installed:

```bash
nvm install
nvm use
npm ci
npm run dev
```

Workout drafts are stored per Janus account in the browser with `localStorage`. Completed sessions are saved through Janus in the authenticated user's Firestore `workout_history` subcollection and cached locally for display. Existing browser-only history is uploaded once when workout sync first becomes available. Set `VITE_JANUS_API_URL` to override the production Janus API URL during local API development.

Deploy the Janus workout endpoints before deploying this Aether version. Until Janus exposes `/api/workouts`, Aether keeps existing cached history visible but will not clear a completed workout draft or claim that the session was saved.

In development, the login screen also offers an isolated demo account preloaded with sample workout history and a partially completed session. Demo credentials, controls, and fixtures are excluded from production bundles and do not write to Janus or Firestore.

The account page uses Janus's shared AI profile and encrypted credential endpoints. Signed-in users can connect OpenAI, Mistral, or Anthropic, choose an available model, remove provider keys, and delete their Janus account. Provider selections are account-wide and are therefore shared with Nyx.

## Quality checks

```bash
npm run check
npm run build
```

`check` runs ESLint and the focused workout/storage tests. The production build also verifies that development-only demo fixtures are absent and that public icon assets stay within their size budgets.

The full-resolution generated icon is retained in `artwork/`. Regenerate the optimized favicon, Apple touch icon, and UI icon with `npm run icons`.

## Cloud Run

The production container builds the Vite application with Node 24 and serves it with nginx on port `8080`, including SPA fallback, immutable caching for hashed assets, and a `/health` endpoint.

```bash
gcloud run deploy aether \
  --source . \
  --project donal-geraghty-home \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080
```

### GitHub Actions deployment

The workflow at `.github/workflows/deploy-gcp.yml` runs lint and tests for pull requests and deployments. After a successful check on `main`, `master`, or a manual run, it builds the production frontend once inside its container, pushes SHA and `latest` tags to the existing `aether` Artifact Registry repository, deploys it with startup and liveness probes, and checks `/health`. It can also be started manually with **Actions → Deploy Aether to Cloud Run → Run workflow**.

Configure this repository before the first workflow run:

- Preferred repository variable `GCP_WORKLOAD_IDENTITY_PROVIDER`: the full Google Workload Identity Provider resource name. When set, the workflow uses keyless GitHub OIDC authentication.
- Optional repository variable `GCP_SERVICE_ACCOUNT`: the deployer service account used with Workload Identity Federation. It defaults to the dedicated, keyless `aether-github-deployer@donal-geraghty-home.iam.gserviceaccount.com` account.
- Fallback repository secret `GCP_SA_KEY`: the existing service-account JSON. The workflow uses this only while `GCP_WORKLOAD_IDENTITY_PROVIDER` is unset.
- Optional repository variable `VITE_JANUS_API_URL`: defaults to the current deployed Janus API URL when omitted.
- Optional repository variable `CLOUD_RUN_SERVICE_ACCOUNT`: a dedicated runtime identity such as `aether-runtime@donal-geraghty-home.iam.gserviceaccount.com`. Until set, Cloud Run retains its current runtime identity.
- Optional GitHub environment `production`: create it if you want approval gates or environment-specific protections. The workflow will also use it without extra protection rules.

The Artifact Registry repository and public Cloud Run service are one-time infrastructure. The workflow no longer recreates the repository or rewrites the public IAM policy on every deployment. For a fresh environment, create the `aether` repository and perform the first deployment with `--allow-unauthenticated` using the manual command above.

For ongoing deployments, the Google Cloud deployment identity needs Artifact Registry Writer on the `aether` repository, Cloud Run Developer on the project or service, and Service Account User on the chosen runtime identity. The Artifact Registry and Cloud Run APIs must be enabled in `donal-geraghty-home`.
