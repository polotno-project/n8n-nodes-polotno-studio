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

	documentationUrl = 'https://docs.studio.polotno.com';

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
				'Project API key from Polotno Studio → API Keys (starts with key_live_ or key_test_)',
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
			placeholder: 'https://api.dev.studio.polotno.com',
			displayOptions: { show: { environment: ['custom'] } },
			description: 'Base URL of your Polotno Studio API (dev/QA or self-hosted)',
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
