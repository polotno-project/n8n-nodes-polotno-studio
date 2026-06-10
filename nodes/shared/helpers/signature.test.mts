import { createHmac } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { verifyWebhookSignature } from './signature';

const secret = 'whsec_test';
const body = JSON.stringify({ type: 'image.completed', id: 'img_1' });
const timestamp = 1700000000;
const sign = (ts: number, rawBody: string): string =>
	createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');
const header = `t=${timestamp},v1=${sign(timestamp, body)}`;

describe('verifyWebhookSignature', () => {
	it('accepts a correct t=,v1= signature', () => {
		expect(verifyWebhookSignature(secret, body, header)).toBe(true);
	});

	it('rejects a tampered body', () => {
		expect(verifyWebhookSignature(secret, '{"type":"image.failed"}', header)).toBe(false);
	});

	it('rejects a tampered timestamp (it is part of the signed value)', () => {
		expect(verifyWebhookSignature(secret, body, `t=1700009999,v1=${sign(timestamp, body)}`)).toBe(
			false,
		);
	});

	it('rejects a wrong, malformed, or missing signature', () => {
		expect(verifyWebhookSignature(secret, body, 't=1,v1=deadbeef')).toBe(false);
		expect(verifyWebhookSignature(secret, body, 'garbage')).toBe(false);
		expect(verifyWebhookSignature(secret, body, undefined)).toBe(false);
	});
});
