# Comic Extension Demo Template

Copy this folder to create a new comic extension.

## Differences from Novel

| Aspect | Novel | Comic |
|--------|-------|-------|
| `chap.js` | HTML text | Image URLs |
| TOC | Flat list | May have volumes |
| Cover size | Smaller | Larger |

## Usage

1. Copy: `cp -r extensions/_demo_comic extensions/<your_name>`
2. Edit `plugin.json` — replace `TODO_` values
3. Edit `src/config.js` — set BASE_URL
4. Test: `vbook validate && vbook debug`