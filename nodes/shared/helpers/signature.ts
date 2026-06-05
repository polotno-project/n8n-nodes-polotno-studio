import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies a Polotno Studio webhook signature.
 *
 * Scheme (from the backend webhooks module, Stripe-style): the `x-signature`
 * header is `t={unixSeconds},v1={hex}` where the signature is
 * `HMAC-SHA256(secret, `${t}.${rawBody}`)`. The timestamp is part of the signed
 * value, so tampering with it invalidates the signature. Comparison is
 * constant-time. Replay-window enforcement is intentionally left to the caller.
 */
export function verifyWebhookSignature(
	secret: string,
	rawBody: string,
	signatureHeader: string | undefined,
): boolean {
	if (!signatureHeader) return false;
	const parsed = parseSignatureHeader(signatureHeader);
	if (!parsed) return false;

	const expected = createHmac('sha256', secret)
		.update(`${parsed.timestamp}.${rawBody}`)
		.digest('hex');
	const expectedBuffer = Buffer.from(expected);
	const providedBuffer = Buffer.from(parsed.signature);
	return (
		expectedBuffer.length === providedBuffer.length &&
		timingSafeEqual(expectedBuffer, providedBuffer)
	);
}

/** Parses an `x-signature` value of the form `t={ts},v1={hex}`. */
function parseSignatureHeader(header: string): { timestamp: string; signature: string } | null {
	let timestamp: string | undefined;
	let signature: string | undefined;
	for (const part of header.split(',')) {
		const eq = part.indexOf('=');
		if (eq === -1) continue;
		const key = part.slice(0, eq).trim();
		const value = part.slice(eq + 1).trim();
		if (key === 't') timestamp = value;
		else if (key === 'v1') signature = value;
	}
	if (!timestamp || !signature) return null;
	return { timestamp, signature };
}
