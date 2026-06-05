import { config } from '@n8n/node-cli/eslint';

// Tests and the vitest config are dev-only (never published in `dist`), so they
// are excluded from the n8n community-node lint (which would otherwise flag the
// `vitest` dev import under its no-runtime-dependencies rule).
export default [...config, { ignores: ['**/*.test.ts', 'vitest.config.ts'] }];
