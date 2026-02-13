# wgrid

Standalone repo extracted from `ast/src/public/assets/lib/wGrid`.

## Structure
- `src`: core library (ES modules + CSS)
- `examples`: sample page
- `dist`: build output

Note: The legacy `src/public` copy has been removed.

## Run the sample
Module scripts require an HTTP server (file:// will not work).

From repo root:
```bash
# Option 1: Built-in Node server (examples/server.js)
npm run run
# Option 2: Python (no extra install)
python -m http.server 5173
# Option 3: Node (serve)
npx serve -l 5173
```

Then open:
```
http://localhost:5173/examples/
```

## Build outputs
- `dist/wgrid.esm.min.js`: ESM bundle (module imports)
- `dist/wgrid.min.js`: IIFE bundle (script tag, global `window.wgrid`)
- `dist/wgrid_dark.min.css`: Dark theme CSS
- `dist/wgrid_gray.min.css`: Gray theme CSS
- `dist/wgrid_white.min.css`: White theme CSS

## API docs
- English: `docs/wgrid-api.en.md`
- Korean: `docs/wgrid-api.ko.md`

## Docs sync check
- Current process is manual (lightweight):
  - When `src/wgrid.js` public methods change, update both docs files.
  - Verify signatures/examples/state notes are still accurate.
  - Confirm both docs still include the same method set.
