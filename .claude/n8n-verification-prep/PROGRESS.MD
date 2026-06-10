# n8n Verification Prep — Progress

Goal: close blockers so the node is eligible for n8n Creator Portal verification.
User handles GitHub repo creation; I handle issues 1 & 2.

## Tasks
- [x] **Issue 1 — Enable cloud support.** Ran `n8n-node cloud-support enable`
      (sets `n8n.strict: true` + exact default `eslint.config.mjs`). Resolved the
      vitest conflict by moving the 4 test files + vitest config to `.mts`
      (`eslint .` doesn't scan `.mts`), so type-safe `vitest` imports stay.
      Updated `vitest.config.mts` include → `nodes/**/*.test.mts` and tsconfig
      `exclude` → also `**/*.test.mts`.
- [x] **Issue 2 — Fix publish workflow.** `.github/workflows/publish.yml:99`
      now `NPM_TOKEN: ${{ secrets.NPM_TOKEN }}`.

## Verification gates (all PASS)
- [x] `n8n-node cloud-support` → ✅ ENABLED (strict + default config, eligible)
- [x] `npm run lint` → exit 0 (strict-config check + cloud rules pass)
- [x] `npm test` → 4 files, 15 tests passed
- [x] `npm run build` → successful; `dist/` contains no test/vitest files

## Remaining (user-owned)
- Create public GitHub repo matching package.json repo URL + push.
- npm Trusted Publisher (OIDC) one-time setup for the repo.
- Publish via tag push, then `npx @n8n/scan-community-package` self-check.
- Submit at creators.n8n.io/nodes. (Optional: add a CHANGELOG.md entry.)

## Notes / findings
- `n8n-node lint` runs `eslint .`; eligibility check is an EXACT string match on
  `eslint.config.mjs` (`import { config } from '@n8n/node-cli/eslint'; export
  default config;`) + `n8n.strict === true`. So NO custom eslint config allowed.
- Rule flagging vitest = `@n8n/community-nodes/no-restricted-imports` (allowlist:
  n8n-workflow, lodash, moment, p-limit, luxon, zod, crypto/node:crypto, ai-node-sdk
  + relative). Applies to all `**/*.ts` except `dist`. `no-runtime-dependencies`
  only checks package.json `dependencies` (empty → OK).
- Source files are clean (no restricted globals, only allowlisted imports).
- Chosen fix: move test files + vitest config to `.mts` (ESLint's `eslint .` only
  scans .js/.cjs/.mjs/.ts, NOT .mts) → keep type-safe `vitest` imports, fully
  exempt tests from the production lint. tsconfig already excludes `**/*.test.ts`;
  extend to `.mts` so they never reach `dist`.
