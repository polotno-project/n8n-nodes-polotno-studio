// Narrow, hand-picked re-exports of the generated OpenAPI types. The full
// generated file (`./types/api.ts`) is produced by `npm run gen:types` from
// the vendored spec (`openapi/polotno-studio.yaml`) — the single source of
// truth for the wire contract.
import type { components } from './types/api';

export type Template = components['schemas']['Template'];
export type ImageRender = components['schemas']['Image'];
export type VideoRender = components['schemas']['Video'];

// `DynamicField` and `DynamicFieldInput` are inlined in the spec rather than
// emitted as standalone components, so derive them from the schemas that
// contain them (the flat dynamic-fields response and the image render body).
export type DynamicField = NonNullable<components['schemas']['DynamicFields']['fields']>[number];
export type DynamicFieldInput = NonNullable<
	components['schemas']['ImageCreate']['dynamic_fields']
>[number];

export type RenderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
