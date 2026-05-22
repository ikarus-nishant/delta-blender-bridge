# Vercel Update Feed

This folder is a minimal static Vercel project that hosts the Blender updater manifest used by the add-on.

## Files

- `release-manifest.json`: the manifest Blender downloads
- `vercel.json`: disables stale caching for the manifest

## Deploy

1. Create a separate Git repository for the update feed, or deploy this folder from the current repo.
2. Import the project into Vercel.
3. Set the project root to `update_feed`.
4. Deploy.
5. Use the deployed manifest URL in Blender:

```txt
https://YOUR-PROJECT.vercel.app/release-manifest.json
```

## Manifest format

```json
{
  "version": "1.0.1",
  "channel": "stable",
  "minimumBlenderVersion": "4.2.0",
  "url": "https://your-download-host.example.com/r3f_live_preview_blender_v1.0.1.zip",
  "sha256": "REPLACE_WITH_RELEASE_ZIP_SHA256",
  "releaseNotes": "Optional release notes text or URL"
}
```

## Recommended release flow

1. Build the Blender extension zip locally.
2. Upload the zip to a stable public URL.
3. Compute its SHA-256.
4. Update `release-manifest.json` with the new version, zip URL, and checksum.
5. Redeploy the Vercel project.

## Test in Blender

1. Set `Update feed URL` to the Vercel manifest URL.
2. Click `Check Updates`.
3. Confirm the add-on downloads the staged zip into:

```txt
%LOCALAPPDATA%\R3FLivePreview\updates
```
