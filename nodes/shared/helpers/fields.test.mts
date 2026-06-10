import { describe, expect, it } from 'vitest';

import { mappedValueToDynamicFields } from './fields';

describe('mappedValueToDynamicFields', () => {
	it('splits flat keys into { name, [suffix]: value }', () => {
		expect(
			mappedValueToDynamicFields({
				fields__headline__text: 'Sale!',
				fields__product_image__image_url: 'https://x/y.jpg',
				fields__bg__color: '#0066FF',
			}),
		).toEqual([
			{ name: 'headline', text: 'Sale!' },
			{ name: 'product_image', image_url: 'https://x/y.jpg' },
			{ name: 'bg', color: '#0066FF' },
		]);
	});

	it('coerces visible to boolean and font_size to number', () => {
		expect(
			mappedValueToDynamicFields({
				fields__badge__visible: 'false',
				fields__title__font_size: '48',
			}),
		).toEqual([
			{ name: 'badge', visible: false },
			{ name: 'title', font_size: 48 },
		]);
	});

	it('skips null/undefined/empty values', () => {
		expect(
			mappedValueToDynamicFields({
				fields__a__text: '',
				fields__b__text: null as unknown as string,
				fields__c__text: 'keep',
			}),
		).toEqual([{ name: 'c', text: 'keep' }]);
	});

	it('ignores keys that do not match the flat format', () => {
		expect(mappedValueToDynamicFields({ random: 'x', fields__d__text: 'ok' })).toEqual([
			{ name: 'd', text: 'ok' },
		]);
	});

	it('returns an empty array for null or undefined (untouched mapper)', () => {
		expect(mappedValueToDynamicFields(null)).toEqual([]);
		expect(mappedValueToDynamicFields(undefined)).toEqual([]);
	});
});
