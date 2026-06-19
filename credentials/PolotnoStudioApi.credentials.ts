import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

const PROD_BASE_URL = 'https://api.studio.polotno.com';

export class PolotnoStudioApi implements ICredentialType {
	name = 'polotnoStudioApi';

	displayName = 'Polotno Studio API';

	documentationUrl = 'https://automation.studio.polotno.com/docs';

	icon: Icon = { light: 'file:polotno.svg', dark: 'file:polotno.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Project API key from Polotno Studio. Create one at https://automation.studio.polotno.com (starts with key_live_).',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			default: 'production',
			options: [
				{ name: 'Production', value: 'production' },
				{ name: 'Custom', value: 'custom' },
			],
			description: 'Which Polotno Studio environment to call',
		},
		{
			displayName: 'Custom Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://api.studio.polotno.com',
			displayOptions: { show: { environment: ['custom'] } },
			description: 'Override the Polotno Studio API base URL',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: `={{$credentials.environment === "custom" ? $credentials.baseUrl : "${PROD_BASE_URL}"}}`,
			url: '/v1/templates',
			qs: { limit: 1 },
		},
	};
}
