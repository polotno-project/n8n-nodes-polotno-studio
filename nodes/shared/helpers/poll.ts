import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { sleep } from 'n8n-workflow';

import { polotnoApiRequest } from '../transport/request';

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'partial']);

interface StatusLike {
	status?: string;
}

/**
 * Polls `getStatus` until it returns a terminal status or `maxAttempts` is
 * reached. Returns the last seen value either way (never throws on timeout —
 * the caller decides how to treat a still-pending result). `sleep` is injected
 * so the loop is deterministic in tests.
 */
export async function pollUntilTerminal<T extends StatusLike>(
	getStatus: () => Promise<T>,
	options: { sleep: (ms: number) => Promise<void>; maxAttempts: number; delayMs?: number },
): Promise<T> {
	let last = await getStatus();
	for (let attempt = 1; attempt < options.maxAttempts; attempt++) {
		if (last.status !== undefined && TERMINAL_STATUSES.has(last.status)) return last;
		await options.sleep(options.delayMs ?? 2000);
		last = await getStatus();
	}
	return last;
}

/**
 * Node-facing wrapper: polls `GET /v1/{kind}/{id}` until the render reaches a
 * terminal status or the max wait elapses.
 */
export async function waitForRender(
	ctx: IExecuteFunctions,
	kind: 'images' | 'videos',
	id: string,
	options: { maxWaitSeconds: number },
): Promise<IDataObject> {
	const delayMs = 2000;
	const maxAttempts = Math.max(1, Math.ceil((options.maxWaitSeconds * 1000) / delayMs));
	return pollUntilTerminal<IDataObject & StatusLike>(
		() => polotnoApiRequest(ctx, 'GET', `/v1/${kind}/${id}`) as Promise<IDataObject & StatusLike>,
		{ sleep, maxAttempts, delayMs },
	);
}
