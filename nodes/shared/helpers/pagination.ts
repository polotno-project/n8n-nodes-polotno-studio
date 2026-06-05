interface Page<T> {
	items: T[];
	next_cursor: string | null;
}

/**
 * Walks a cursor-paginated endpoint. `fetchPage(cursor)` returns one page; we
 * follow `next_cursor` until it is null or `maxPages` is reached (safety cap).
 */
export async function walkCursor<T>(
	fetchPage: (cursor: string | undefined) => Promise<Page<T>>,
	options: { maxPages?: number } = {},
): Promise<T[]> {
	const maxPages = options.maxPages ?? 20;
	const items: T[] = [];
	let cursor: string | undefined;
	for (let page = 0; page < maxPages; page++) {
		const result = await fetchPage(cursor);
		items.push(...result.items);
		if (!result.next_cursor) break;
		cursor = result.next_cursor;
	}
	return items;
}
