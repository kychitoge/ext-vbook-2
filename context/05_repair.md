# 05_repair.md — Extension Repair Guide

> Step-by-step guide for fixing broken extensions.

---

## Prerequisites
```bash
vbook check-env --json
```
→ Confirm device is online. If not → update `VBOOK_IP` in `.env`.

---

## Repair Workflow

### STEP 1 — Gather Context

Read first:
- `extensions/<name>/plugin.json` → source, regexp, version
- `extensions/<name>/src/*.js` → current implementation

Identify failing script:
- "không load truyện" → test detail.js
- "không có chapter" → test toc.js
- "đọc bị lỗi" → test chap.js
- "trang chủ trống" → test home.js or gen.js

---

### STEP 2 — Reproduce Error

```bash
vbook debug src/<failing_script>.js -in "<url>" --json
```

Check JSON response:
```json
{
  "exception": "Cannot read property 'text' of null",
  "log": "...",
  "data": null
}
```

---

### STEP 3 — Diagnose Root Cause

**Check if website changed:**
```bash
vbook analyze "<source_url>" --json
```

Compare selectors in code vs analyze output.

Also check for Cloudflare: `"cloudflare": true` → need `Engine.newBrowser()`.

---

### STEP 4 — Fix Code

**Selector changed:**
```js
// OLD
var name = doc.select(".truyen-title a").text();

// NEW
var name = doc.select("h1.book-name, .title-info h1").text();
```

**Cloudflare protection:**
```js
var b = Engine.newBrowser();
b.setUserAgent(UserAgent.android);
try {
    b.launch(url, 12000);
    var doc = b.html();
} finally {
    b.close();
}
```

**Domain changed:**
1. Update `src/config.js` with new BASE_URL
2. Update `plugin.json`:
```json
{
  "metadata": {
    "source": "https://new-domain.com",
    "regexp": "new-domain\\.com/truyen/[^/]+/?$"
  }
}
```

---

### STEP 5 — Validate & Confirm

```bash
vbook validate ./extensions/<name>
vbook debug src/<fixed_script>.js -in "<url>" --json
```

Verify `exception: null` and `data` is valid.

---

### STEP 6 — Regression Test

```bash
vbook test-all --from <fixed_step> --json
```

---

### STEP 7 — Bump & Publish

```bash
vbook build --bump
vbook publish
```

Report: old version → new version, what changed.

---

## Decision Tree

```
Extension broken
├── No data from detail.js?
│   ├── Run: vbook analyze <source_url>
│   ├── Update selectors
│   └── Cloudflare? → Engine.newBrowser()
│
├── No chapters in toc.js?
│   ├── Chapters dynamically loaded
│   └── Try: Engine.newBrowser() + b.waitUrl()
│
├── Chap content empty?
│   ├── Content in different container
│   └── Check iframe
│
└── Search returns nothing?
    ├── Search URL pattern changed
    └── Update search.js URL construction
```

---

## Quick Commands
```bash
# Pinpoint failing script
vbook debug src/<script>.js -in "<url>" --json

# Analyze website
vbook analyze "<url>" --json

# Validate syntax
vbook validate ./<name>

# Full test from step
vbook test-all --from <step> --json

# Build & publish
vbook build --bump
vbook publish
```