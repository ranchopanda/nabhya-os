# Fix the "Preview has not been built yet" error

## What's actually happening

The local dev server is healthy (Vite is running, returning HTML, no compile errors). The error is coming from the **static preview deployment**, not the live sandbox:

```
[proxy-worker2] Error: Worker bundle not found:
dwl:pre:27d2ddaa-...:07f8e80a:_worker_bundle.json
→ 404 at id-preview--...lovable.app/
```

The preview infrastructure is trying to load a worker bundle for commit SHA `07f8e80a` that was never published (the previous preview build either failed or was evicted from storage). Until a new preview build is published for the current code, the preview URL keeps returning the "Preview has not been built yet" page.

I checked the code that was last changed (the new `/data-entry` route, `useCurrentRole`, `AppShell`, `ensureCurrentMember` server fn, the regenerated `routeTree.gen.ts`) and there are no compile errors blocking the build — so a rebuild should succeed.

## Plan

1. **Trigger a fresh build** by making a no-op safe edit and letting the system publish a new preview bundle. Concretely:
   - Run `bun run build` once in the sandbox to confirm the production/SSR build still compiles cleanly end-to-end (this is what the preview pipeline runs). If it surfaces an error, fix it before re-publishing.
2. **If `bun run build` fails**, the most likely suspects (based on recent changes) are:
   - `src/routes/_authenticated/data-entry.tsx` — verify all 10 dialog components still export the expected `trigger` prop signature.
   - `src/lib/member.functions.ts` — confirm the dynamic `client.server` import resolves under the Worker bundle.
   - `src/routeTree.gen.ts` — if it is out of sync with the files in `src/routes/_authenticated/`, delete it and let the Vite plugin regenerate.
   I will read the build output and patch only the file(s) the error points to — no speculative rewrites.
3. **Re-publish the preview** so the proxy can find a fresh `_worker_bundle.json` for the new SHA. After that, reload `id-preview--...lovable.app` — it should serve the app instead of the "not built" page.
4. **Verify**: open the preview URL, confirm `/`, `/data-entry`, and `/members` all render, and check `stack_modern--server-function-logs deployment=preview` shows `200`s instead of `Worker bundle not found`.

## Notes

- No schema changes, no new dependencies, no UI redesign — this is purely a build/publish recovery.
- If the rebuild keeps failing for the same reason after one fix attempt, I'll stop and report the exact error instead of looping.
