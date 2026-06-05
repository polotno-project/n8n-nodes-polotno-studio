import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchResult,
	ResourceMapperField,
	ResourceMapperFields,
} from 'n8n-workflow';

import { walkCursor } from '../shared/helpers/pagination';
import { polotnoApiRequest } from '../shared/transport/request';
import type { DynamicField, Template } from '../shared/types';

interface TemplateListPage {
	items: Template[];
	next_cursor: string | null;
}

/**
 * resourceLocator "From List" search: lists templates for the project, using
 * server-side name search when the user types a filter, following cursors.
 */
export async function searchTemplates(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const templates = await walkCursor<Template>(
		async (cursor) => {
			const qs: IDataObject = { limit: 50 };
			if (filter) qs.name = filter;
			if (cursor) qs.cursor = cursor;
			return (await polotnoApiRequest(this, 'GET', '/v1/templates', {
				qs,
			})) as unknown as TemplateListPage;
		},
		{ maxPages: 10 },
	);

	return {
		results: templates.map((template) => ({
			name: template.name,
			value: template.id,
			url: template.self_url,
		})),
	};
}

const FIELD_TYPE_MAP: Record<DynamicField['type'], ResourceMapperField['type']> = {
	string: 'string',
	url: 'string',
	integer: 'number',
	color: 'string',
	boolean: 'boolean',
};

/**
 * resourceMapper schema fetch: reads the selected template id and returns its
 * dynamic fields as typed resource-mapper fields. The flat `key`
 * (`fields__{name}__{suffix}`) is kept verbatim as the field id so the value
 * round-trips back into the render payload (see helpers/fields.ts).
 */
export async function getTemplateFields(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	const templateId = this.getNodeParameter('template', '', {
		extractValue: true,
	}) as string;

	if (!templateId) {
		return { fields: [] };
	}

	const response = (await polotnoApiRequest(
		this,
		'GET',
		`/v1/templates/${templateId}/dynamic-fields`,
	)) as unknown as { fields: DynamicField[] };

	const fields: ResourceMapperField[] = response.fields.map((field) => ({
		id: field.key,
		displayName: field.label,
		required: field.required,
		defaultMatch: false,
		canBeUsedToMatch: false,
		display: true,
		type: FIELD_TYPE_MAP[field.type],
	}));

	return { fields };
}
