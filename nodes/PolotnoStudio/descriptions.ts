import type { INodeProperties } from 'n8n-workflow';

export const resourceProperty: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	default: 'image',
	options: [
		{ name: 'Image', value: 'image' },
		{ name: 'Template', value: 'template' },
		{ name: 'Video', value: 'video' },
	],
};

export const operationProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'render',
		displayOptions: { show: { resource: ['image'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get an image render by ID',
				action: 'Get an image',
			},
			{
				name: 'Render',
				value: 'render',
				description: 'Render an image from a template',
				action: 'Render an image',
			},
		],
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'render',
		displayOptions: { show: { resource: ['video'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get a video render by ID',
				action: 'Get a video',
			},
			{
				name: 'Render',
				value: 'render',
				description: 'Render a video from a template',
				action: 'Render a video',
			},
		],
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'getAll',
		displayOptions: { show: { resource: ['template'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get a single template',
				action: 'Get a template',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'List templates in the project',
				action: 'Get many templates',
			},
		],
	},
];

export const templateLocator: INodeProperties = {
	displayName: 'Template',
	name: 'template',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'The template to use',
	displayOptions: {
		show: {
			resource: ['image', 'video', 'template'],
			operation: ['render', 'get'],
		},
	},
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			typeOptions: { searchListMethod: 'searchTemplates', searchable: true },
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^tpl_[A-Za-z0-9]+$',
						errorMessage: 'Template IDs start with tpl_',
					},
				},
			],
			placeholder: 'tpl_0123456789abcdef',
		},
		{
			displayName: 'By URL',
			name: 'url',
			type: 'string',
			extractValue: { type: 'regex', regex: '/v1/templates/(tpl_[A-Za-z0-9]+)' },
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '.*/v1/templates/tpl_[A-Za-z0-9]+.*',
						errorMessage: 'Not a valid Polotno Studio template URL',
					},
				},
			],
			placeholder: 'https://api.studio.polotno.com/v1/templates/tpl_…',
		},
	],
};

export const renderIdField: INodeProperties = {
	displayName: 'Render ID',
	name: 'renderId',
	type: 'string',
	required: true,
	default: '',
	placeholder: 'img_0123456789abcdef',
	displayOptions: { show: { resource: ['image', 'video'], operation: ['get'] } },
	description:
		'ID of the render to fetch (img_… for an image, vid_… for a video) — e.g. from a previous Render node or a webhook',
};

export const fieldsMapper: INodeProperties = {
	displayName: 'Fields',
	name: 'fields',
	type: 'resourceMapper',
	noDataExpression: true,
	default: { mappingMode: 'defineBelow', value: null },
	displayOptions: { show: { resource: ['image', 'video'], operation: ['render'] } },
	typeOptions: {
		loadOptionsDependsOn: ['template.value'],
		resourceMapper: {
			resourceMapperMethod: 'getTemplateFields',
			mode: 'add',
			addAllFields: true,
			supportAutoMap: true,
			fieldWords: { singular: 'field', plural: 'fields' },
		},
	},
};

export const imageRenderFields: INodeProperties[] = [
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['image'], operation: ['render'] } },
		options: [
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				default: 'png',
				options: [
					{ name: 'JPEG', value: 'jpeg' },
					{ name: 'PDF', value: 'pdf' },
					{ name: 'PNG', value: 'png' },
				],
			},
			{
				displayName: 'Pixel Ratio',
				name: 'pixelRatio',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 10 },
				description: 'Scale factor for the output resolution (1–10)',
			},
			{
				displayName: 'Transparent',
				name: 'transparent',
				type: 'boolean',
				default: false,
				description: 'Whether to render with a transparent background (PNG only)',
			},
		],
	},
];

export const videoRenderFields: INodeProperties[] = [
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['video'], operation: ['render'] } },
		options: [
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				default: 'mp4',
				options: [
					{ name: 'GIF', value: 'gif' },
					{ name: 'MP4', value: 'mp4' },
				],
			},
			{
				displayName: 'FPS',
				name: 'fps',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 1, maxValue: 120 },
				description: 'Frames per second',
			},
			{
				displayName: 'Duration (Seconds)',
				name: 'durationSeconds',
				type: 'number',
				default: 5,
				typeOptions: { minValue: 1, maxValue: 600 },
				description: 'Length of the video in seconds',
			},
		],
	},
];

export const renderCommonFields: INodeProperties[] = [
	{
		displayName: 'Wait for Completion',
		name: 'waitForCompletion',
		type: 'boolean',
		default: true,
		displayOptions: { show: { resource: ['image', 'video'], operation: ['render'] } },
		description:
			'Whether to poll until the render finishes and output the final URL. Turn off to return the job immediately and continue via the Polotno Studio Trigger.',
	},
	{
		displayName: 'Max Wait (Seconds)',
		name: 'maxWaitSeconds',
		type: 'number',
		default: 120,
		typeOptions: { minValue: 5, maxValue: 600 },
		displayOptions: {
			show: { resource: ['image', 'video'], operation: ['render'], waitForCompletion: [true] },
		},
		description: 'Maximum time to wait before returning the still-pending job',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['image', 'video'], operation: ['render'] } },
		options: [
			{
				displayName: 'Metadata (JSON)',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description: 'Arbitrary JSON object stored with the render and echoed back on completion',
			},
		],
	},
];

export const templateListFields: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['template'], operation: ['getAll'] } },
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 100 },
		displayOptions: {
			show: { resource: ['template'], operation: ['getAll'], returnAll: [false] },
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['template'], operation: ['getAll'] } },
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Filter by template name (case-insensitive substring)',
			},
			{
				displayName: 'Tag',
				name: 'tag',
				type: 'string',
				default: '',
				description: 'Filter by a single tag',
			},
			{
				displayName: 'Include Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
				description: 'Whether to include archived templates',
			},
		],
	},
];
