# 02_workflow.md — AI Development SOP

> Standard workflow for creating and maintaining VBook extensions.

---

## 🚨 PRIME DIRECTIVE — READ THIS BEFORE ANYTHING ELSE

```
╔══════════════════════════════════════════════════════════════════╗
║  NO REAL DATA   →  DO NOT WRITE CODE                            ║
║  CHECK-ENV FAIL →  DO NOT DEBUG OR FIX ANYTHING                 ║
║  NO DEVICE TEST →  DO NOT PUBLISH                               ║
╚══════════════════════════════════════════════════════════════════╝
```

### ❌ FORBIDDEN ACTIONS — Absolute prohibition, no exceptions:

- Guessing selectors by reading HTML source visually instead of using `mcp_vbook_inspect`
- Editing regex/selectors without a real device response
- Continuing after `check-env` returns timeout or any error
- "Trying anyway" after any step fails
- Explaining errors from experience when no real log exists
- Apologizing and then doing the forbidden thing anyway

### ✅ Mandatory self-check BEFORE every action:

```
[ ] Has check-env PASSED?              → No → STOP, notify user
[ ] Do I have real data from device?   → No → STOP, run debug first
[ ] Has the previous step completed?   → No → STOP, do not skip
```

> **Why these rules exist:** Vietnamese novel sites commonly use Cloudflare, client-side JS rendering,
> or session-dependent HTML. Fixing code without a real device test may appear correct in a desktop
> browser but fail completely inside VBook's Rhino runtime. Every shortcut creates silent bugs that
> are harder to debug than stopping and asking.

---

## Creating a NEW Extension (8 Steps)

### STEP 0 — ORCHESTRATED FLOW (RECOMMENDED) 🔴 MANDATORY

**AI MUST call `mcp_vbook_create_extension_flow(site_url)` as the very first action.**

This tool automatically:
1.  **Checks Environment**: (VBOOK_IP connectivity).
    -   If it returns `blocked_env`: **STOP**. Tell the user to update `.env`.
2.  **Scaffolds Demo**: Creates a minimal extension directory.
3.  **Requests Answers**: Returns `need_answers` status with the standardized questionnaire in Vietnamese:

```text
Để tạo extension, vui lòng cung cấp các thông tin sau:

1. Loại truyện? (Novel / Comic / Chinese novel / Translate / TTS)
2. Tag? (Normal / 18+)
3. Link trang DANH SÁCH truyện (Trang chủ hoặc trang danh sách thể loại):
4. Link trang CHI TIẾT một truyện (Bất kỳ truyện nào):
5. Link trang MỤC LỤC chương (Nếu khác trang chi tiết):
6. Link trang ĐỌC một CHƯƠNG cụ thể:
7. Có tìm kiếm (Search) không? [Có / Không]
8. Có danh mục thể loại (Genres) không? [Có / Không]
```

**AI MUST wait for all answers before calling the flow again with the `answers` object.**

---

### STEP 1 — Inspect Website 🔴 DO NOT WRITE CODE BEFORE THIS STEP

Once the flow reports `success`, inspect **ALL** URLs provided by the user using `mcp_vbook_analyze(url)` or `mcp_vbook_inspect(url)`:

```
mcp_vbook_inspect(url_listing)  → selectors: list item, title, link, cover
mcp_vbook_inspect(url_detail)   → selectors: name, author, cover, status, description, genres
mcp_vbook_inspect(url_toc)      → selectors: chapter links, pagination (yes or no?)
mcp_vbook_inspect(url_chapter)  → selectors: chapter content
```

**Record all results. Do NOT write a single line of code before this step completes.**

> ⚠️ If `mcp_vbook_inspect` times out or errors → STOP immediately. Notify user to check device.

---

#### STEP 2 — Scaffold

```bash
vbook create "<n>" --source "<url>" --type <novel|comic|chinese_novel>
```

**⚠️ POST-SCAFFOLD CHECK**: Verify `icon.png` is a valid image file (not HTML/text).

---

#### STEP 3 — Implement with REAL Selectors

- Use results from Step 1 to populate `src/*.js`
- **STRICTLY FORBIDDEN**: generic placeholders such as `.book-item`, `.story-item`, `h3 a`, `.title a`, `#content`
- **CRITICAL RUNTIME RULES**: No `async/await`, no `?.`, no `??`, no spread operator (Rhino ES6 constraint)
- **page.js RULE**: ALWAYS create `page.js`. No pagination → `return Response.success([url])`. Has pagination → return array of page URLs. `toc.js` receives each URL from this array in sequence.

---

#### STEP 4 — Static Check

```bash
vbook validate ./<n>
```

> ⚠️ If validate reports any error → FIX NOW. Do not proceed to Step 5.

---

#### STEP 5 — Individual Testing

```bash
vbook debug src/detail.js -in "<url_to_book>"
vbook debug src/chap.js -in "<url_to_chapter>"
```

> ⚠️ If debug errors → fix and re-run validate before continuing.

---

#### STEP 6 — Full Flow Verification

```bash
vbook test-all
```

**After test-all PASSES, also verify:**

- `vbook debug src/search.js -in "keyword"` (if search exists)
- `vbook debug src/genre.js` (if genres exist)
- Visually confirm `icon.png` renders correctly
- Test with a real URL from the live website

---

#### STEP 7 — Package & Publish

```bash
vbook publish
```

**Only run this step when ALL previous steps have passed.**

---

### Repair / Edit Extension (6 Steps)

1. **Locate & Analyze** — Read the failing extension's `src/*.js` and `plugin.json`
2. **Verify Status** — Check in browser whether site structure changed; run `vbook debug` to get the exact error
3. **Fix Code & Config** — Update selectors/parsing in `src/`; if domain changed, update `metadata.source` and `metadata.regexp`
4. **Validate & Local Test** — `vbook validate` then `vbook debug` again
5. **Bump Version & Build** — `vbook build --bump`
6. **Update Registry** — `vbook publish`

---

### Autonomous Maintenance (Auto-Fix)

```
🚨 MANDATORY FIRST STEP — NEVER SKIP:

    vbook check-env --json

    ✅ PASS  → continue workflow below
    ❌ FAIL  → OUTPUT EXACTLY:
               "❌ DEVICE UNREACHABLE. Please:
                1. Open VBook app → Web Server tab
                2. Check current IP and Port
                3. Update vbook-tool/.env with the new IP
                Then let me know so I can re-run the test properly."
               → FULL STOP. Do NOT guess the error.
                  Do NOT read source. Do NOT attempt any fix.
```

After check-env PASSES:

1. Reproduce: `vbook debug src/detail.js -in "<failing_url>"`
2. Fix code → `vbook validate`
3. Verify: `vbook debug` again
4. If OK: `vbook test-all`
5. Bump & Publish: `vbook build --bump && vbook publish`
6. Report new version to user

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `ReferenceError: server is not defined` | Declare `server` with `let` outside the try block |
| `data: "NaN"` in next param | Use `String(parseInt(page \|\| '1') + 1)` |
| `gen.js` returned no data | Check if home uses different selectors; prefer dedicated list URLs |
| `ClassCastException` | Main function MUST be `execute()`, not `home()`, `gen()`, etc. |
| Character obfuscation | Use cleanContent helper with Regex |
| Redirects in search | Detect with: `if (doc.select("SELECTOR_TITLE").size() > 0)` |

---

## Best Practices

### config.js Pattern
```js
let BASE_URL = "https://...";
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch(e) {}
```

### URL Normalization
```js
url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
```

### Regexp in plugin.json
Must match the detail page URL only:
```
"https?:\\/\\/(?:www\\\\.)?domain\\\\.net\\/truyen\\/[a-zA-Z0-9-]+\\/?$"
```

### Internal API Discovery (Highest Priority)
Always check `/api/` routes before falling back to HTML selectors:
```js
BASE_URL + "/api/novels/slug/<slug>"
BASE_URL + "/api/novels/<id>"
BASE_URL + "/api/novels/search?title=<key>"
```

### Home Tab Pagination
```js
{ title: "Mới cập nhật", input: BASE_URL + "/PATH/{{page}}", script: "gen.js" }
```

### Genres as Objects
```js
genres: novel.genres.map(genre => ({
    title: genre,
    input: BASE_URL + "/list?genre=" + encodeURIComponent(genre),
    script: "gen.js"
}))
```

### VIP Chapters
```js
chapList.push({ name: "...", url: "...", pay: true/false, host: BASE_URL });
```

### page.js — Default Rules

`page.js` is **mandatory**. Receives `url` from detail, returns an array of URLs for `toc.js`.

```js
// No pagination:
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);
    return Response.success([url]);
}

// With pagination:
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load");
    let doc = response.html();
    let pages = [];
    doc.select("SELECTOR_PAGINATION_LINKS").forEach(function(el) {
        let href = el.attr("href") + "";
        if (href && !href.includes("#")) {
            if (!href.startsWith("http")) href = BASE_URL + href;
            pages.push(href);
        }
    });
    if (pages.length === 0) return Response.success([url]);
    return Response.success(pages);
}
```