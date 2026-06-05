import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { verifyWebhookSignature } from '../shared/helpers/signature';
import { polotnoApiRequest } from '../shared/transport/request';

// Polotno Studio signs deliveries with the `x-signature` header in the form
// `t={unixSeconds},v1={hex}`, where the HMAC-SHA256 signs `${t}.${rawBody}`
// (see nodes/shared/helpers/signature.ts). Header lookups are lower-cased by n8n.
const SIGNATURE_HEADER = 'x-signature';

export class PolotnoStudioTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Polotno Studio Trigger',
		name: 'polotnoStudioTrigger',
		icon: { light: 'file:polotno.svg', dark: 'file:polotno.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when a Polotno Studio render completes or fails',
		defaults: { name: 'Polotno Studio Trigger' },
		usableAsTool: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'polotnoStudioApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['image.completed', 'video.completed'],
				options: [
					{ name: 'Image Completed', value: 'image.completed' },
					{ name: 'Image Failed', value: 'image.failed' },
					{ name: 'Video Completed', value: 'video.completed' },
					{ name: 'Video Failed', value: 'video.failed' },
				],
				description: 'The render events that should start the workflow',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				return typeof webhookData.webhookId === 'string';
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const events = this.getNodeParameter('events') as string[];
				const response = await polotnoApiRequest(this, 'POST', '/v1/webhooks', {
					body: { url: webhookUrl, events },
				});
				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = response.id as string;
				webhookData.secret = response.secret as string;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (typeof webhookData.webhookId === 'string') {
					try {
						await polotnoApiRequest(this, 'DELETE', `/v1/webhooks/${webhookData.webhookId}`);
					} catch {
						// Subscription may already be gone server-side; clear local state regardless
						// so n8n will re-register on the next activation.
					}
					delete webhookData.webhookId;
					delete webhookData.secret;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const webhookData = this.getWorkflowStaticData('node');
		const request = this.getRequestObject();
		const headers = this.getHeaderData() as IDataObject;
		const signature = headers[SIGNATURE_HEADER] as string | undefined;

		// Verify the HMAC signature over the RAW request bytes (re-serializing the
		// parsed body would not byte-match what the server signed). n8n exposes the
		// raw body via `readRawBody()` / `req.rawBody`. If it can't be obtained we
		// skip verification rather than reject valid events.
		if (typeof webhookData.secret === 'string') {
			let rawBody = request.rawBody as Buffer | undefined;
			if (!rawBody && typeof request.readRawBody === 'function') {
				try {
					await request.readRawBody();
					rawBody = request.rawBody as Buffer | undefined;
				} catch {
					// leave rawBody undefined — verification is skipped below
				}
			}
			if (
				rawBody &&
				!verifyWebhookSignature(webhookData.secret, rawBody.toString('utf8'), signature)
			) {
				throw new NodeOperationError(this.getNode(), 'Invalid Polotno Studio webhook signature');
			}
		}

		const payload = request.body as IDataObject;
		const data = payload.data as IDataObject | undefined;
		const object = (data?.object as IDataObject | undefined) ?? payload;

		return {
			workflowData: [this.helpers.returnJsonArray([object])],
		};
	}
}
