import type { DynamicFieldInput } from '../types';

const FLAT_KEY = /^fields__(.+?)__(.+)$/;

/**
 * Converts a resourceMapper value object keyed by the `/dynamic-fields` flat
 * key (`fields__{name}__{suffix}`) into the render API's `dynamic_fields`
 * array. The suffix IS the DynamicFieldInput property name (text, image_url,
 * video_url, color, visible, font_family, font_size) — so no type table is
 * needed; the contract does the work.
 */
export function mappedValueToDynamicFields(
	value: Record<string, unknown> | null | undefined,
): DynamicFieldInput[] {
	const fields: DynamicFieldInput[] = [];
	if (!value) return fields;
	for (const [key, raw] of Object.entries(value)) {
		if (raw === null || raw === undefined || raw === '') continue;
		const match = FLAT_KEY.exec(key);
		if (!match) continue;
		const name = match[1];
		const suffix = match[2];
		fields.push({ name, [suffix]: coerce(suffix, raw) } as DynamicFieldInput);
	}
	return fields;
}

function coerce(suffix: string, raw: unknown): unknown {
	if (suffix === 'visible') return raw === true || raw === 'true';
	if (suffix === 'font_size') return typeof raw === 'number' ? raw : Number(raw);
	return raw;
}
