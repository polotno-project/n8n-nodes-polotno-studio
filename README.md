# n8n-nodes-polotno-studio

This is an n8n community node. It lets you render images and videos from your
[Polotno Studio](https://studio.polotno.com) templates in your n8n workflows.

Polotno Studio is a content-automation platform that turns design templates into
on-brand images and videos via a simple API. This package adds a node to fill a
template's dynamic fields and render it, plus a trigger that fires when a render
completes.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Trigger](#trigger) · [Usage](#usage) · [Resources](#resources)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)
and use the package name `n8n-nodes-polotno-studio`.

## Credentials

You need a **project API key** from Polotno Studio. To find it, sign in to
[Polotno Studio](https://studio.polotno.com), open the editor, open the project
selector, click **Manage projects**, and copy the API key for your project.
Keys start with `key_live_`.

Create a **Polotno Studio API** credential and paste the key. Leave the
environment as **Production**, or choose **Custom** and enter a base URL to point
at a dev/QA or self-hosted instance. n8n validates the key when you save the
credential.

## Operations

The **Polotno Studio** node has three resources:

### Image → Render

Renders an image from a template.

1. Pick a **Template** (search by name, paste a `tpl_…` ID, or paste a template URL).
2. The template's **Fields** load automatically as typed inputs (text, image URL,
   color, toggle, …). Map values from earlier nodes or type them directly.
3. Optionally set **Format** (PNG/JPEG/PDF), **Transparent**, and **Pixel Ratio**.
4. **Wait for Completion** is on by default: the node waits for the render and
   outputs the final `image_url`. Turn it off to return the job immediately and
   continue via the trigger.

### Video → Render

Renders a video (MP4/GIF) from a template. Same template + fields flow as images,
plus **FPS** and **Duration**. Video renders are billed as `fps × duration`
credits and can take longer — for long videos, turn **Wait for Completion** off
and use the **Polotno Studio Trigger** instead.

### Image / Video → Get

Fetches an existing render by its ID (`img_…` / `vid_…`) and returns its current
state, including `image_url` / `video_url` once `status` is `completed`. Use this
to retrieve a result from an **async** render (Render with *Wait for Completion*
off, which returns only an `id`), to re-fetch what a webhook referenced, or to
re-check a render that exceeded the wait window.

### Template → Get / Get Many

List templates in your project (with optional **Name**, **Tag**, and archived
filters) or fetch a single template by ID.

## Trigger

The **Polotno Studio Trigger** starts a workflow when a render finishes. On
activation it registers a webhook subscription with Polotno Studio; on
deactivation it removes it. Choose which events to listen for:

- `image.completed` / `image.failed`
- `video.completed` / `video.failed`

The event's payload object (the completed image or video) is emitted as the
workflow item.

## Usage

A common pattern:

1. A trigger (e.g. a new row in a sheet) starts the workflow.
2. **Polotno Studio → Image → Render**: choose a template, map the row's columns
   onto the template fields, keep **Wait for Completion** on.
3. Use the returned `image_url` in the next step (post to social, email, upload, …).

For high-volume or long video pipelines, render with **Wait for Completion** off
and let the **Polotno Studio Trigger** continue the flow when each render
completes.

## Compatibility

Requires n8n 1.x. Tested against current n8n community-node tooling
(`@n8n/node-cli`).

## Resources

- [Polotno Studio API documentation](https://polotno.com/docs/overview)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE.md)
