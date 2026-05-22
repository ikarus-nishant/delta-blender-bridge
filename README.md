# R3F Live Preview for Blender

Windows-first monorepo for a Blender 4.2+ extension that exports GLB assets and previews them in a local React Three Fiber viewer through a localhost bridge.

## Workspace

- `blender_extension/`: Blender extension package and Python runtime logic.
- `bridge/`: Local HTTP/WebSocket bridge server in Node.js + TypeScript.
- `viewer/`: Vite + React Three Fiber browser viewer.
- `shared/`: Cross-runtime protocol definitions.
- `scripts/`: Build, packaging, and development helpers.
- `docs/`: Architecture, support, troubleshooting, and release notes.

## Quick start

1. Install Node.js 20+ if it is not already available on your machine.

2. Install dependencies:

```cmd
npm install
```

3. Run the development services:

```cmd
npm run dev:viewer
npm run dev:bridge
```

4. Build everything:

```cmd
npm run build
```

5. Package the Blender extension:

```cmd
npm run package:extension
```

## Production flow

- Blender exports `live_model.glb` into a session folder.
- Blender starts the local bridge and registers the session.
- Bridge serves the bundled viewer and session assets from `127.0.0.1`.
- Viewer connects over WebSocket and updates on full-model reloads or material patches.

## V1 updater

The Blender add-on can now check a simple remote JSON manifest, download a newer extension zip into a local staging folder, and show that an update is ready.

Current updater behavior:
- checks in the background on add-on load when `Auto-check for updates` is enabled
- supports manual checks from the `R3F Live Preview` panel
- downloads the new zip into `%LOCALAPPDATA%\\R3FLivePreview\\updates`
- verifies the downloaded zip with `sha256`
- does not self-install yet; it stages the zip and tells you to reinstall it

Expected update manifest format:

```json
{
  "version": "1.0.1",
  "channel": "stable",
  "minimumBlenderVersion": "4.2.0",
  "url": "https://your-internal-host/r3f_live_preview_blender_v1.0.1.zip",
  "sha256": "PUT_THE_RELEASE_ZIP_SHA256_HERE",
  "releaseNotes": "Optional text or URL"
}
```

How to test the updater:
1. Host a newer extension zip and a manifest JSON on an internal HTTP or HTTPS URL.
2. In Blender add-on preferences, set `Update feed URL` to that manifest URL.
3. Leave `Auto-check for updates` enabled, or click `Check Updates` in the sidebar panel.
4. Wait a few seconds.
5. Confirm the panel/preferences show a pending version.
6. Click `Open Update Folder` to inspect the staged zip.
7. Reinstall that downloaded zip manually in Blender to apply the update.

### Vercel hosting

A minimal Vercel-ready update feed is included in [update_feed/README.md](E:/PROJECTS/blender-delta-bridge/update_feed/README.md).

Use this manifest URL pattern in Blender after deployment:

```txt
https://YOUR-PROJECT.vercel.app/release-manifest.json
```

## Current limitations

- V1 supports Principled BSDF-centric extraction only.
- Texture path changes force a full GLB export.
- Blender requires Node.js to be installed on the workstation before preview can start.
- The packaged bridge is bundled into a single script and is started by Blender through the local Node.js runtime.
