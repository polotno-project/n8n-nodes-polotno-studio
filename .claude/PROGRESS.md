# n8n-nodes-polotno-studio — Progress

Verified n8n community node for Polotno Studio (render images/videos from templates).
Design + plan live in the platform repo: `docs/superpowers/plans/2026-06-05-n8n-nodes-polotno-studio.md`.

## Done

- Scaffolded with `@n8n/node-cli` (programmatic template), CommonJS, code under `nodes/`.
- **Credential** `PolotnoStudioApi`: API key (password) + environment selector + Bearer auth + `test` request.
- **Action node** `Polotno Studio`: resources Image / Video / Template.
  - Template picker = `resourceLocator` (list search by name / ID / URL).
  - Dynamic fields = `resourceMapper` (`getTemplateFields`) reading the selected template.
  - Image & Video **Render** wait-for-completion by default (images use `?sync=true` then poll; videos poll via `sleep`).
  - Image & Video **Get** — fetch a render by id (`img_…`/`vid_…`); closes the async loop (Render with wait off → get the result later, or after a webhook / wait-timeout).
  - Template Get / Get Many (with name/tag/archived filters, returnAll + limit).
- **Trigger node** `Polotno Studio Trigger`: webhook lifecycle (create/checkExists/delete) + HMAC signature verify.
- **Types** generated from the vendored OpenAPI spec (`openapi/polotno-studio.yaml` → `nodes/shared/types/api.ts` via `npm run gen:types`). `DynamicField`/`DynamicFieldInput` derived from `DynamicFields`/`ImageCreate` (they're inlined, not standalone components).
- **Pure helpers** (TDD, vitest): `mappedValueToDynamicFields`, `walkCursor`, `pollUntilTerminal`/`waitForRender`, `verifyWebhookSignature`.
- README (English), MIT LICENSE.
- CI publish workflow with provenance is provided by the scaffold (`.github/workflows/publish.yml`).

## Local gates (all green)

- `npm run build` (tsc + icons) ✓
- `npm run lint` (n8n cloud-compatibility rules) ✓
- `npm test` → 13/13 ✓

Note: `n8n.strict` is set to `false` so the eslint config can ignore dev-only test files (`**/*.test.ts`, `vitest.config.ts`) under the no-runtime-dependencies rule. Cloud-support linting (the verification-relevant checks) remains **enabled**.

## Webhook signature — wired to the backend scheme

Confirmed against `apps/backend/src/modules/webhooks/{webhooks.signing.ts,webhooks.delivery.ts}`:
header **`x-signature`** = `t={unixSeconds},v1={hex}`, where `HMAC-SHA256(secret, `${t}.${rawBody}`)`.
`nodes/shared/helpers/signature.ts` parses + verifies this (timestamp is part of the signed value);
the trigger obtains the raw bytes via n8n's `request.readRawBody()` / `req.rawBody` and verifies, failing
open only if the raw body can't be obtained. Remaining: confirm end-to-end in a live n8n that `readRawBody()`
yields the bytes (n8n-version dependent), and decide whether to enforce the replay-window (timestamp tolerance).

## Remaining

- **Verify resourceMapper runtime behavior** in a live n8n (the `getNodeParameter('template', '', { extractValue: true })` read inside `getTemplateFields`, and `fields.value` in execute).
- **Publish + verify** (needs the owner): create the public GitHub repo, set up npm Trusted Publishing (or `NPM_TOKEN`), then `npm run release` to tag → the workflow publishes with provenance. Run `npx @n8n/scan-community-package n8n-nodes-polotno-studio` (scans the *published* package). Submit for verification (n8n will request a short demo video).
- **E2E smoke** against the dev/QA env with a `key_test_…` key: credential test → template search → dynamic fields load → image render (wait) → video render (async) → trigger receipt.
- Backend prerequisites (template name search + dynamic-field `required`) are implemented on the platform branch `feat/n8n-integration` — must be merged + deployed for the live API to expose them.
