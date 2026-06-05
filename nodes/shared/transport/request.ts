import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

export const PROD_BASE_URL = 'https://api.studio.polotno.com';

type RequestContext = IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions;

/**
 * Resolves the API base URL from the credential. Defaults to production;
 * a `custom` environment lets users point at a dev/QA or self-hosted instance.
 */
export function resolveBaseUrl(credentials: IDataObject): string {
	if (
		credentials.environment === 'custom' &&
		typeof credentials.baseUrl === 'string' &&
		credentials.baseUrl.length > 0
	) {
		return credentials.baseUrl.replace(/\/+$/, '');
	}
	return PROD_BASE_URL;
}

/**
 * Authenticated request to the Polotno Studio API. Auth header injection is
 * handled by the credential's `authenticate` block; we only resolve the base
 * URL and delegate to n8n's built-in HTTP helper (no runtime dependencies).
 */
export async function polotnoApiRequest(
	ctx: RequestContext,
	method: IHttpRequestMethods,
	path: string,
	options: { body?: IDataObject; qs?: IDataObject } = {},
): Promise<IDataObject> {
	const credentials = await ctx.getCredentials('polotnoStudioApi');
	const baseURL = resolveBaseUrl(credentials as IDataObject);

	return (await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'polotnoStudioApi', {
		method,
		baseURL,
		url: path,
		body: options.body,
		qs: options.qs,
		json: true,
	})) as IDataObject;
}
