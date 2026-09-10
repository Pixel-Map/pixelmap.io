# Embedded Mario Paint

`/paint/0` through `/paint/3969` are statically exported pages. Each loads current
tile metadata, expands the existing PixelMap image codec and maps its RGB444
pixels to the game's 15-color palette. Invalid or empty artwork is reported
instead of silently painting a substitute. Tile 123 currently has `image: "1"`;
use `/paint/439` for a real artwork example.

All paint pages automatically load `/mario.sfc`, including the deployed website.
The frontend build copies the repository-root ROM into `frontend/out/mario.sfc`.
Run `pnpm --dir frontend dev` for development, or build then run
`pnpm --dir frontend paint:local` for the exported preview at port 3008. Both
local servers bind to loopback and serve the root ROM directly. Visitors only
see a file picker if automatic loading fails. Start Game still requires a click
so the browser can enable game audio.

The Mario Paint (Japan, USA) ROM is checked against
SHA-256 `e842cac1a4301be196f1e137fbd1a16866d5c913f24dbca313f4dd8bd7472f45`.
A 512-byte copier header is accepted and stripped before hashing. ROM bytes stay
in browser memory, pass directly to the same-origin emulator iframe, and become
a temporary Blob URL. The selected file is not uploaded or persisted by the page.
The iframe is destroyed on route changes and replay. Emulator
save files can still be saved locally with its own controls.

## Actual game, actual mouse clicks

The runtime uses the Snes9x core in EmulatorJS. It connects a SNES mouse to
controller port 1, clicks Mario on the title screen, opens the second toolbar
and Special Stamp editor, selects palette colors and clicks all 256 grid cells.
It does not write artwork into game memory or substitute a canvas recreation.

Read-only cursor feedback at WRAM `$7e:04dc` (16-bit X) and `$7e:04de` (16-bit Y)
corrects missed mouse movements. Inputs wait for emulated frames, not wall-clock
delays. Cursor movement is bounded, stalled emulation reports an error, and
physical input is blocked during automation. Take over cancels the sequence,
releases the mouse button and returns input to the visitor. Every finished
drawing is checked against a native framebuffer screenshot before reporting
completion. All 256 cell colors must match the requested palette indices.

Coordinates for the supported ROM, in native 256 × 224 pixels:

- Title: Mario crosses X=128, Y=145; click his path until the canvas appears.
- Second toolbar: (236, 211); Special Stamp editor: (54, 211).
- Palette: (30 + 14 × color index, 15), indices 0–14.
- Grid: (52 + 8 × column, 52 + 8 × row), 16 × 16 cells.
- Park the cursor at (24, 190) before verifying the completed image.

## Pinned emulator assets

`frontend/public/paint/vendor/manifest.json` records the source and SHA-256 of
each vendored asset, captured September 10, 2026. Runtime is EmulatorJS
4.3.0-pre with the July 25, 2026 Snes9x legacy WASM core. Stable 4.2.3 does not
expose the controller-port API this integration needs. All executable assets
are served locally; the legacy core is forced so the feature does not depend
on cross-origin isolation headers or fetch a different core on capable browsers.
The upstream version check may make a read-only request to the EmulatorJS CDN.

The adapter intentionally uses version-specific GameManager APIs for frames,
mouse device selection, read-only RAM and screenshots. Test the complete flow
before updating any vendored file; do not change the CDN path to a moving build.

Sources and licenses:

- https://github.com/EmulatorJS/EmulatorJS (GPL-3.0, license included)
- https://github.com/EmulatorJS/RetroArch (RetroArch frontend/core glue)
- https://github.com/EmulatorJS/snes9x (core build source)
- https://github.com/snes9xgit/snes9x (Snes9x license included)
- https://emulatorjs.org/docs/options/

Run `node scripts/check-paint-assets.mjs` to verify the pinned asset hashes.

For an automated cold boot and full pixel verification:

```sh
node scripts/verify-mario-paint.mjs http://localhost:3000 '/path/to/Mario Paint.sfc' 439
# Test automatic loading from the local server:
node scripts/verify-mario-paint.mjs http://localhost:3000 auto 293
```

This uses `npx agent-browser`, selects the ROM through the page, starts the
emulator, waits for the runtime's complete 256-cell framebuffer check, saves a
screenshot in `/tmp`, checks browser errors and closes its own browser session.

## Local verification

Run the frontend normally with `mario.sfc` at the repository root, open `/paint/439`, then click
Start Game. Allow the game to navigate and draw until it reports all 256 pixels
painted. Check early Take over, Restart drawing, loading errors, another tile,
and a narrow viewport. Verify that the export includes `/mario.sfc` and that
automatic loading works on the production domain. The conversion tests cover compressed and malformed
artwork. A complete run usually takes a few minutes, depending on browser speed.

This is an embedded game, not an autoplay video. Browsers require a start click
for audio/game execution. Mouse or trackpad use on desktop is the primary
experience. Both local and deployed pages load the ROM automatically.

### Verification on September 10, 2026

- Production static export: 19,861 total pages, including 3,970 paint pages.
- Frontend: 269 tests passed; typecheck passed; lint has no errors and the
  existing 30 warnings.
- Real browser cold boots for tiles 439 and 955 completed and passed the native
  framebuffer comparison for all 256 cells each, with no browser errors.
- Physical mouse input worked after completion. Early takeover stopped the
  automated cursor, and restart created a fresh emulator without another ROM
  selection. Save State and Load State controls remain available.
- Tile-detail navigation reaches the correct paint page. A 375px viewport has
  no horizontal overflow.

These checks are local production-build checks, not a production deployment.

Local autoload was also verified on tile 293. Its full recording passed the
256-cell check and was exported as a 102.9-second, 1440 × 1080, 60 fps H.264 MP4
with 48 kHz stereo AAC audio. The exported video decoded without errors.
This core uses `rwebaudio`, so audio capture taps its Web Audio output into a
MediaStream destination; the upstream recorder's OpenAL-only audio lookup does
not capture sound from this build.
