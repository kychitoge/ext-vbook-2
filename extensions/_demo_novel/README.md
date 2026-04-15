# Extension Demo Template

Copy this folder to create a new novel extension.

## Usage

1. Copy to new folder: `cp -r extensions/_demo_novel extensions/<your_name>`
2. Edit `plugin.json` — replace `TODO_` values
3. Edit `src/config.js` — set BASE_URL
4. Test: `vbook validate && vbook debug`

## Files

- `plugin.json` — metadata & script mapping
- `icon.png` — 64x64 icon (replace TODO icon)
- `src/config.js` — BASE_URL (MUST use `let`, NOT `const`)
- `src/home.js` — home tabs
- `src/genre.js` — genre list
- `src/gen.js` — book list (newest, hot, by genre)
- `src/search.js` — search
- `src/detail.js` — book detail
- `src/toc.js` — chapter list
- `src/chap.js` — chapter content