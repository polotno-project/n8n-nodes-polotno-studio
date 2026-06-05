import { describe, expect, it } from 'vitest';

import { pollUntilTerminal } from './poll';

const noSleep = async (): Promise<void> => {};

describe('pollUntilTerminal', () => {
	it('resolves when status becomes completed', async () => {
		const statuses = ['pending', 'processing', 'completed'];
		let i = 0;
		const result = await pollUntilTerminal(async () => ({ status: statuses[i++], id: 'img_1' }), {
			sleep: noSleep,
			maxAttempts: 10,
		});
		expect(result.status).toBe('completed');
	});

	it('returns the last result when attempts run out (no throw)', async () => {
		const result = await pollUntilTerminal(async () => ({ status: 'pending' }), {
			sleep: noSleep,
			maxAttempts: 3,
		});
		expect(result.status).toBe('pending');
	});

	it('stops immediately on a terminal failed status', async () => {
		let calls = 0;
		const result = await pollUntilTerminal(
			async () => {
				calls++;
				return { status: 'failed' };
			},
			{ sleep: noSleep, maxAttempts: 5 },
		);
		expect(result.status).toBe('failed');
		expect(calls).toBe(1);
	});
});
