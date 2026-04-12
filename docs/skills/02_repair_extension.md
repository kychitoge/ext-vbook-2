# Skill: Repair/Fix a VBook Extension

**Trigger**: User says "sửa", "fix", "broken", "lỗi", or a specific extension name is mentioned as not working.

## Prerequisites

```bash
vbook check-env --json
```
→ Confirm device is online. If not → update `VBOOK_IP` in `vbook-tool/.env` first.

---

## Step-by-Step Workflow

### STEP 1 — Gather context

Read these files first (do NOT skip):
- `extensions/<name>/plugin.json` → source URL, regexp, version
- `extensions/<name>/src/*.js` → existing implementation

Identify which script is failing:
- If user says "không load được truyện" → test `detail.js`
- If user says "không có chapter" → test `toc.js`
- If user says "đọc bị lỗi" → test `chap.js`
- If user says "trang chủ trống" → test `home.js` or `gen.js`

### STEP 2 — Reproduce the error on device

```bash
vbook debug extensions/<name>/src/<failing_script>.js -in "<url>" --json
```

Parse the JSON response:
```json
{
  "exception": "Cannot read property 'text' of null",
  "log": "...",
  "data": null
}
```

The `exception` field tells you exactly what went wrong.

### STEP 3 — Diagnose the root cause

**Check if the website structure changed:**

```bash
vbook analyze "<source_url>" --json
```

Compare current selectors in `src/<script>.js` vs selectors found in analyze output.

If selectors don't match → the website was redesigned.

**Also check:** Does the website now have Cloudflare? Look for `"cloudflare": true` in analyze output → May need to switch from `fetch()` to `Engine.newBrowser()`.

### STEP 4 — Fix the code

Update `src/<script>.js` with corrected selectors or logic.

Common patterns:
```js
// OLD (broken): selector changed
var name = doc.select(".truyen-title a").text();

// NEW: use new selector found by vbook analyze
var name = doc.select("h1.book-name, .title-info h1").text();
```

For Cloudflare protection: replace `fetch(url)` block with `Engine.newBrowser()`. If it requires a manual captcha, explicitly instruct the user to open the VBook app on their phone and pass the captcha manually to store the clearance cookie:
```js
var b = Engine.newBrowser();
b.setUserAgent(UserAgent.android);
try {
    b.launch(url, 12000);
    var doc = b.html();
    // ... rest of parsing
} finally {
    b.close();   // NEVER skip this
}
```

If domain changed:
1. Update `src/config.js` with the new `BASE_URL`.
2. Update `plugin.json` to reflect the new domain:
```json
{
  "metadata": {
    "source": "https://new-domain.com",
    "regexp": "new-domain\\.com/truyen/[^/]+/?$"
  }
}
```
**Important:** Ensure `regexp` strictly matches the detail page using `[^/]+/?$` so VBook app can catch correctly.

### STEP 5 — Validate & confirm fix

```bash
vbook validate ./extensions/<name>
```

Fix any errors. Then confirm the fix works on device:
```bash
vbook debug extensions/<name>/src/<fixed_script>.js -in "<url>" --json
```

Verify `exception` is null and `data` has valid content.

### STEP 6 — Regression test

Run the full flow to make sure nothing else broke:
```bash
vbook test-all --from <fixed_step> --json
```

Example: if you fixed `detail.js`, run from detail:
```bash
vbook test-all --from detail --json
```

### STEP 7 — Bump version and publish

```bash
vbook build --bump
vbook publish
```

`--bump` auto-increments `version` in `plugin.json`.

After publishing, report:
- Old version → New version
- What was changed (selector X → selector Y, added Cloudflare bypass, etc.)
- Which script(s) were fixed

---

## Diagnosis Decision Tree

```
Extension broken
├── No data from detail.js?
│   ├── Run: vbook analyze <source_url>
│   ├── Compare selectors → update detail.js
│   └── Cloudflare? → switch to Engine.newBrowser()
│
├── No chapters in toc.js?  
│   ├── Chapter list may be dynamically loaded
│   └── Try: Engine.newBrowser() + b.waitUrl()
│
├── Chap content empty?
│   ├── Content wrapped in different container
│   ├── Try: doc.select("article, .content, [class*=content]").html()
│   └── Check if content is in iframe
│
└── Search returns nothing?
    ├── Search URL pattern changed
    ├── Run: vbook analyze "<source>/search?q=test"
    └── Update URL construction in search.js
```

---

## Quick Reference

```bash
# Pinpoint the failing script
vbook debug src/<script>.js -in "<url>" --json

# Analyze current website structure
vbook analyze "<url>" --json

# Check for Rhino syntax errors after editing
vbook validate ./<name>

# Test full chain from a specific step
vbook test-all --from <step> --json

# Bump version + build zip
vbook build --bump

# Update registry
vbook publish
```
