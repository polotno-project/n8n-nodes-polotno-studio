import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { mappedValueToDynamicFields } from '../shared/helpers/fields';
import { walkCursor } from '../shared/helpers/pagination';
import { waitForRender } from '../shared/helpers/poll';
import { polotnoApiRequest } from '../shared/transport/request';
import {
	fieldsMapper,
	imageRenderFields,
	operationProperties,
	renderCommonFields,
	renderIdField,
	resourceProperty,
	templateListFields,
	templateLocator,
	videoRenderFields,
} from './descriptions';
import { getTemplateFields, searchTemplates } from './methods';

interface TemplateListPage {
	items: IDataObject[];
	next_cursor: string | null;
}

function parseMaybeJson(value: unknown): unknown {
	if (typeof value === 'string') {
		try {
			return JSON.parse(value);
		} catch {
			return value;
		}
	}
	return value;
}

export class PolotnoStudio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Polotno Studio',
		name: 'polotnoStudio',
		icon: { light: 'file:polotno.svg', dark: 'file:polotno.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Render images and videos from Polotno Studio templates',
		defaults: { name: 'Polotno Studio' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'polotnoStudioApi', required: true }],
		properties: [
			resourceProperty,
			...operationProperties,
			templateLocator,
			renderIdField,
			fieldsMapper,
			...imageRenderFields,
			...videoRenderFields,
			...renderCommonFields,
			...templateListFields,
		],
	};

	methods = {
		listSearch: { searchTemplates },
		resourceMapping: { getTemplateFields },
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'template') {
					if (operation === 'get') {
						const id = this.getNodeParameter('template', i, '', { extractValue: true }) as string;
						const template = await polotnoApiRequest(this, 'GET', `/v1/templates/${id}`);
						returnData.push({ json: template, pairedItem: { item: i } });
					} else {
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const baseQs: IDataObject = {};
						if (filters.name) baseQs.name = filters.name;
						if (filters.tag) baseQs.tag = filters.tag;
						if (filters.archived) baseQs.archived = true;

						if (returnAll) {
							const templates = await walkCursor<IDataObject>(async (cursor) => {
								const qs: IDataObject = { ...baseQs, limit: 100 };
								if (cursor) qs.cursor = cursor;
								return (await polotnoApiRequest(this, 'GET', '/v1/templates', {
									qs,
								})) as unknown as TemplateListPage;
							});
							for (const template of templates) {
								returnData.push({ json: template, pairedItem: { item: i } });
							}
						} else {
							const limit = this.getNodeParameter('limit', i, 50) as number;
							const response = (await polotnoApiRequest(this, 'GET', '/v1/templates', {
								qs: { ...baseQs, limit },
							})) as unknown as TemplateListPage;
							for (const template of response.items ?? []) {
								returnData.push({ json: template, pairedItem: { item: i } });
							}
						}
					}
				} else if (operation === 'get') {
					const kind = resource === 'video' ? 'videos' : 'images';
					const renderId = this.getNodeParameter('renderId', i) as string;
					const result = await polotnoApiRequest(this, 'GET', `/v1/${kind}/${renderId}`);
					returnData.push({ json: result, pairedItem: { item: i } });
				} else {
					const kind = resource === 'video' ? 'videos' : 'images';
					const templateId = this.getNodeParameter('template', i, '', {
						extractValue: true,
					}) as string;
					const mapper = this.getNodeParameter('fields.value', i, {}) as IDataObject | null;
					const options = this.getNodeParameter('options', i, {}) as IDataObject;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
					const wait = this.getNodeParameter('waitForCompletion', i, true) as boolean;

					const body: IDataObject = {
						template_id: templateId,
						dynamic_fields: mappedValueToDynamicFields(mapper),
					};
					if (options.format !== undefined) body.format = options.format;
					if (resource === 'image') {
						if (options.transparent !== undefined) body.transparent = options.transparent;
						if (options.pixelRatio !== undefined) body.pixel_ratio = options.pixelRatio;
					} else {
						if (options.fps !== undefined) body.fps = options.fps;
						if (options.durationSeconds !== undefined) {
							body.duration_seconds = options.durationSeconds;
						}
					}
					if (additionalFields.metadata !== undefined) {
						body.metadata = parseMaybeJson(additionalFields.metadata) as IDataObject;
					}

					const useSync = kind === 'images' && wait;
					let render = await polotnoApiRequest(this, 'POST', `/v1/${kind}`, {
						body,
						qs: useSync ? { sync: true } : undefined,
					});

					const status = render.status as string | undefined;
					if (wait && status !== 'completed' && status !== 'failed' && status !== 'partial') {
						const maxWaitSeconds = this.getNodeParameter('maxWaitSeconds', i, 120) as number;
						render = await waitForRender(this, kind, render.id as string, { maxWaitSeconds });
					}
					returnData.push({ json: render, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				if ((error as { httpCode?: string }).httpCode !== undefined) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject, { itemIndex: i });
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
