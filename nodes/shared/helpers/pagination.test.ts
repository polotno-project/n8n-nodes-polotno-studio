import { describe, expect, it } from 'vitest';

import { walkCursor } from './pagination';

describe('walkCursor', () => {
	it('follows next_cursor until null', async () => {
		const pages = [
			{ items: [{ id: '1' }], next_cursor: 'c1' },
			{ items: [{ id: '2' }], next_cursor: 'c2' },
			{ items: [{ id: '3' }], next_cursor: null },
		];
		let i = 0;
		const out = await walkCursor(async () => pages[i++]!, { maxPages: 10 });
		expect(out.map((t) => t.id)).toEqual(['1', '2', '3']);
	});

	it('stops at maxPages even if a cursor remains', async () => {
		const out = await walkCursor(async () => ({ items: [{ id: 'x' }], next_cursor: 'always' }), {
			maxPages: 2,
		});
		expect(out).toHaveLength(2);
	});

	it('passes the previous cursor to the next fetch', async () => {
		const seen: Array<string | undefined> = [];
		const pages = [
			{ items: [{ id: '1' }], next_cursor: 'c1' },
			{ items: [{ id: '2' }], next_cursor: null },
		];
		let i = 0;
		await walkCursor(async (cursor) => {
			seen.push(cursor);
			return pages[i++]!;
		});
		expect(seen).toEqual([undefined, 'c1']);
	});
});
