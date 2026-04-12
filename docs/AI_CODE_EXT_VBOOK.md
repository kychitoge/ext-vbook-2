# 🤖 AI Guide for VBook Extension Development

This document provides instructions for AI agents on how to develop and test VBook extensions efficiently using the `vbook` CLI tool.

## 📚 Core References

1. **Runtime Rules**: Read the VBOOK CTX section below carefully — Rhino 1.7.14 has strict ES6 limitations.
2. **Demo Code**: See `vbook_demo.md` for full code examples of every script type.
3. **CLI Tool**: Use `vbook` commands for the entire workflow — never write code blindly.
4. **Lessons Learned**: Read `docs/skills/03_lessons_learned.md` BEFORE creating or fixing any extension — it documents real mistakes and their fixes.

---

## 🛠 AI Development Workflow (SOP)

### 🆕 SCENARIO 1: Create a NEW Extension

Follow these 7 steps precisely:

1.  **Initialize Scaffold**:
    ```bash
    vbook create "<name>" --source "<url>" --type <novel|comic|chinese_novel>
    ```
    This creates the directory, `plugin.json` (auto-fetching `author` from `.env`), and template `src/*.js` files with TODO markers.
     **⚠️ POST-SCAFFOLD CHECK**: Immediately verify `icon.png` is a valid image file (not HTML/text). If the site uses SVG favicon or redirects, manually download the correct logo.

2.  **Research Website**:
    - Use `read_url_content` or `browser` tools to analyze the site's HTML.
    - Identify CSS selectors for: book items (home/search), book details, chapter list (TOC), and content (chap).

3.  **Implement (AI Coding)**:
    - Replace TODOs in `src/*.js` with real selectors and logic.
    - **CRITICAL**: No `async/await`, no `?.`, no `??`, no `...spread`. Use `Response.success()`.

4.  **Static Check (Validate)**:
    ```bash
    vbook validate ./<name>
    ```
    Fix any Rhino compatibility errors immediately.

5.  **Individual File Testing (Debug)**:
    **YES**, you can test each file individually:
    ```bash
    vbook debug src/detail.js -in "<url_to_book>"
    vbook debug src/chap.js -in "<url_to_chapter>"
    ```
    Check `[RESULT]` and `[LOG FROM DEVICE]` in the console.

6.  **Full Flow Verification**:
    ```bash
    vbook test-all
    ```
    Verifies the entire chain: home → gen → detail → toc → chap.
    **⚠️ WARNING**: `test-all` alone is NOT sufficient! After it passes, you MUST also:
    - Test `search.js` manually: `vbook debug src/search.js -in "keyword"`
    - Test `genre.js` manually: `vbook debug src/genre.js`
    - Verify `icon.png` is a valid image
    - Test with a REAL URL from the website (not just auto-generated ones)

7.  **Package & Registry Update**:
    ```bash
    vbook publish
    ```
    Validates → Builds `plugin.zip` → Updates root `plugin.json` registry.

---

### 🔧 SCENARIO 2: Edit or Repair an Extension

Follow these 6 steps:

1.  **Locate & Analyze**:
    - Identify the failing extension (e.g., `ntruyen`).
    - Read `src/*.js` and the existing `plugin.json`.

2.  **Verify Status**:
    - Use `browser` tools to check if the website structure changed.
    - Run `vbook debug` on the failing script to see the exact error from the device.

3.  **Fix Code & Config**:
    - Update CSS selectors or parsing logic in `src/`.
    - If the domain changed, update `metadata.source` and `metadata.regexp` in `plugin.json`.

4.  **Validate & Local Test**:
    - Run `vbook validate` to ensure no new syntax errors were introduced.
    - Run `vbook debug` again to confirm the fix.

5.  **Bump Version & Build**:
    ```bash
    vbook build --bump
    ```
    Increments `version` in `plugin.json` and rebuilds the `plugin.zip`.

6.  **Global Registry Update**:
    ```bash
    vbook publish
    ```
    Updates the root `plugin.json` to reflect the new version/metadata for all users.

---

### 🤖 AGENTIC SOP: Autonomous Maintenance

When asked to "fix" or "repair" an extension, follow this exact sequence without asking for permission:

1.  **Environment Check**:
    - Read `vbook-tool/.env`.
    - If `VBOOK_IP` is missing or the user provided a new one, update it: `VBOOK_IP=xxx.xxx.xxx.xxx`.
2.  **Reproduction**:
    - Use `vbook debug src/detail.js -in "<failing_url>"` to confirm the error on the device.
3.  **Fixing**:
    - Research and apply the fix in `src/`.
    - Run `vbook validate` to ensure ES6 compliance.
4.  **Verification**:
    - Run `vbook debug` again.
    - If OK, run `vbook test-all` to ensure no regression.
5.  **Autonomous Bump & Publish**:
    - Run `vbook build --bump` (increments version in `plugin.json`).
    - Run `vbook publish` (updates root registry).
6.  **Reporting**:
    - Explicitly state the new version and status in your final response.

---

## ⚠️ Common Issues & Troubleshooting

- **`ReferenceError: server is not defined`**: Ensure `server` is declared with `let` outside the `try` block.
- **`data2: "NaN"`**: The `next` parameter in `Response.success(data, next)` is not a valid string number. Always: `String(parseInt(page || '1') + 1)`
- **`gen.js` returned no data**: Check if the home page uses different selectors. Prefer dedicated list URLs (e.g., `/danh-sach/truyen-hot/`).
- **`ClassCastException: UniqueTag cannot be cast to Function`**: This happens if you name the main function `home()`, `gen()`, etc. **ALL scripts MUST export exactly `function execute(...)`.**
- **Character Obfuscation**: Some sites replace characters. Use a `cleanContent` helper with Regex.
- **Shared Utilities**: Use `src/utils.js` for common parsing. Both `gen.js` and `search.js` should `load('utils.js')`.
- **Jsoup API**: `.first()` returns single Element (check null), `.select()` returns Elements (use `.size()`).
- **Redirects in Search**: Detect: `if (doc.select("h1, .entry-title").size() > 0 && doc.select(".entry-content").size() > 0)`.

## 💡 Pro Tips & Advanced Best Practices (SOP Standard)

- **Always validate first**: Run `vbook validate` before debugging to catch syntax errors locally.
- **Use `config.js` for Domain Management**: Create `src/config.js` with `let BASE_URL = "https://...";` (MUST be `let`, NOT `const`!) followed by a `try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch(e) {}` block. Then use `load('config.js');` at the top of ALL scripts. This allows VBook to inject custom domains via `CONFIG_URL`.
- **Robust URL Normalization**: In `detail/toc/chap` scripts, normalize the input URL using Regex to handle missing `www`, http/https changes, or domain mirrors:
  ```javascript
  url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
  ```
- **Fetch using Queries Object**: In `search.js` or API requests, use the `queries` parameter instead of manual string concatenation for cleaner URL encoding:
  ```javascript
  let response = fetch(BASE_URL + "/tim-kiem/", { queries: { tukhoa: key, page: page } });
  ```
- **Discover Internal APIs (AJAX)**: Before doing traditional HTML pagination crawling in `toc.js`, ALWAYS inspect the DOM for hidden values like `<input id="truyen-id">` and check if the site uses an internal API (e.g. `/ajax.php?type=list_chapter`) or `window.__NUXT__`. They are 10x faster.
- **Enrich `detail.js`**: ALWAYS extract lists for `genres` and `suggests` (e.g., author's other works) to elevate the user experience in the VBook app.
- **Regexp in `plugin.json`**: The `regexp` MUST uniquely match the **detail page URL** to allow the VBook app to catch shared URLs from external browsers for adding books. MUST start with `https?:\/\/`, include `(?:www\\.)?` for optional www, use `[a-zA-Z0-9-]+` for slugs (not `[^/]+`), and end with `\/?$`. Example: `"https?:\\/\\/(?:www\\\\.)?domain\\\\.net\\/truyen\\/[a-zA-Z0-9-]+\\/?$"` (Note: In JSON, you need `\\\\` so Java parses it as `\\`, which evaluates to `\` for escaping characters in Regex. Slashes `\/` must be escaped as `\\/` in JSON string). Source should also be escaped: `"https:\\/\\/domain.net"`.
- **Internal API Discovery (SSR/Next.js/Nuxt)**: ALWAYS check if the website has `/api/` routes (e.g. `/api/novels?page=1`) before resorting to `Engine.newBrowser()`. Extracting data directly from JSON is 100x faster than HTML scraping and avoids Cloudflare browser checks. Use browser DevTools Network tab to discover these.
- **URL Format Awareness**: Some sites use `slug-8charID` format (e.g., `ten-truyen-0af9b003`). When this is the case, implement a `slugify()` helper and build URLs with `slugify(title) + "-" + id.slice(-8)`.
- **Home Tab Pagination**: Use `{{page}}` template in home tab inputs (e.g., `BASE_URL + "/trang/{{page}}"`). VBook replaces this automatically. NEVER hardcode page numbers.
- **Genres as Objects**: Return genres in `detail.js` as objects with links, NOT plain strings: `[{title: "Action", input: BASE_URL + "/list?genre=Action&page={{page}}", script: "gen.js"}]`.
- **VIP/Paid Chapters**: If the site has premium content, add `pay: true/false` to each chapter item in `toc.js`.
- **Comment Parsing**: If a website has a comments section API, implement `comment.js` (returns `[{name, content, description}]`).
- **Cryptography / Decoding**: For encrypted platforms, don't write crypto from scratch. You can create/copy and load standard crypto helpers if needed (e.g., `load("base64.js");`, `load("crypto.js");`).
- **Bypass Protections with Browser API**: Use `Engine.newBrowser()` if facing Cloudflare. You can inject scripts to extract variables directly (`b.callJs("return JSON.stringify(window.__NEXT_DATA__);")`) or intercept API URLs fetched dynamically by the webapp (`b.waitUrl(["api/chapters"], 10000); let urls = b.urls();`).
- **Cloudflare Bypass (Manual)**: If the Cloudflare check requires manual captcha or clicking, explicitly **instruct the user** to open the VBook app on their phone and access the site manually to bypass the check and store the clearance cookie.
- **`page.js` for Chapter Pagination**: If `toc.js` is too heavy or requires sequential fetching of HTML chapters, consider implementing a `page.js` (returns `[url1, url2...]` for all chapter API pages), and let `toc.js` parse the JSON list natively per page.
- **Testing Isolated Scripts**: `vbook test-all` generally tests the `home->gen->detail->toc->chap` flow. You MUST manually test `search.js` and `genre.js` separately using the `vbook debug` command: `vbook debug src/search.js -in "keyword"`.

---

## 📈 Guide Self-Evolution (CRITICAL RULE)

**Every time** you finish creating a new extension or fixing a difficult bug, you **MUST** reflect on what caused the issue or what new pattern you learned. If it's a new trick, a strange structure, or a mistake you made, you MUST edit this document (`AI_CODE_EXT_VBOOK.md`) to add that knowledge. This ensures the AI swarm never repeats the same mistake twice. Do not wait for the user to tell you to do this; it is your autonomous duty.

---

## VBOOK_CTX

# vBook Extension — AI Context (Rhino 1.7.14 / ~42% ES6)

## RUNTIME CONSTRAINTS (Rhino 1.7.14)
SUPPORTED: var/let/const, arrow functions, template literals, for..of, destructuring (basic), Promise (basic), class, Map/Set, Symbol, WeakMap, generator function*, shorthand methods, computed property names
UNSUPPORTED — DO NOT USE:
- Spread in function calls: Math.max(...arr) ✗ → Math.max.apply(null,arr) ✓
- Spread in array literals: [...arr] ✗ → arr.slice() / [].concat(arr) ✓
- Default function parameters: function f(a=1) ✗ → a = a===undefined?1:a ✓
- async/await ✗ → synchronous only
- Optional chaining: obj?.prop ✗ → obj && obj.prop ✓
- Nullish coalescing: a??b ✗ → a!=null?a:b ✓
- Array destructuring rest: [a,...rest] ✗
- import/export ✗ → use load("file.js")
- String.matchAll ✗ → use exec() in loop
- Promise.allSettled / Promise.any ✗
SAFE ES6: let/const, `template ${literals}`, ()=>, for..of, {a,b} shorthand, [key] computed, class, Map, Set, Symbol, rest params ...args in function def ✓ (but not spread call)

---

## DIRECTORY
```
extensions/
├── ext-name/plugin.json*, icon.png*(64x64), src/detail.js*, src/toc.js*, src/chap.js*
└── optional: src/home.js, src/genre.js, src/gen.js, src/search.js, src/page.js
(* = required)
```

## PLUGIN.JSON
```json
{
  "metadata": {
    "name":"", "author":"", "version":1, "source":"https://",
    "regexp":"escaped\\.domain\\.com/truyen/.*", 
    "description":"", "locale":"vi_VN|zh_CN|en_US",
    "language":"javascript",
    "type":"novel|comic|chinese_novel|translate|tts",
    "tag":"nsfw"
  },
  "script": {
    "home":"home.js", "genre":"genre.js", "detail":"detail.js",
    "search":"search.js", "page":"page.js", "toc":"toc.js", "chap":"chap.js"
  }
}
```
**CRITICAL `plugin.json` RULES:**
1. **`regexp`**: MUST be a regex that matches the *detail page URL* ONLY (not the root domain, nor the chapter URLs). Example: `domain\\.com/truyen/[^/]+/?$`. It MUST use strict end anchors like `[^/]+/?$` to prevent accidentally matching subpaths like `domain.com/truyen/abc/chapter-1`.
2. **`script`**: The file paths MUST ONLY be the filenames (e.g., `"home": "home.js"`), do NOT include the `src/` directory prefix!
3. **`author`**: MUST read the `.env` file in the `vbook-tool` directory to find the `author=` value, and use it here.
Omit any script key not used. `tag` only if 18+.

---

## SCRIPT CONTRACTS

```
home()           → [{title, input, script}]
genre()          → [{title, input, script}]
gen(url, page)   → [{name*, link*, cover?, description?, host?}], nextPage?
search(key,page) → [{name*, link*, cover?, description?, host?}], nextPage?
detail(url)      → {name*, cover, host, author, description, detail, ongoing:bool*,
                     genres?:[{title,input,script}],
                     suggests?:[{title,input,script}],
                     comments?:[{title,input,script}]}
page(url)        → [urlString, ...]
toc(url)         → [{name*, url*, host?}]
chap(url)        → htmlString
comment(input,next) → [{name, content, description}], nextCursor?
translate(text,from,to) → string
tts(text,lang,voice)    → {audioUrl, text, language}
```

---

## RETURN API
```js
Response.success(data)          // single value
Response.success(data, next)    // data + next (next MUST be string, never number)
Response.error("message")
```

---

## HTTP API
```js
fetch(url)
fetch(url, {method:"POST", headers:{}, body:""})
// body as JSON string: body: JSON.stringify({})
// body as form:        body: "a=1&b=2"

res.ok / res.status
res.headers["set-cookie"] / res.request.headers.cookie
res.html() / res.html("gbk") / res.text() / res.text("gbk") / res.json() / res.base64()

Http.get(url).headers({}).queries({}).html()
Http.post(url).headers({}).body("").string()
```

---

## DOM API (jsoup)
```js
Html.parse(str) → doc
doc.select("css")           // standard CSS + jsoup extensions:
                            // :contains(text), :has(tag), :eq(n), :lt(n), :gt(n)
                            // a[href~=regex], div:matches(regex)
el.text() / el.html() / el.attr("name") / el.outerHtml()
el.first() / el.last() / el.get(i) / el.size() / el.length
el.select("css") / el.remove()
elements.forEach(fn) / elements.map(fn)
```

---

## BROWSER API
```js
var b = Engine.newBrowser()
b.setUserAgent(UserAgent.android|chrome|ios|system)
b.launch(url, timeoutMs)    // sync
b.launchAsync(url)          // async, use sleep() after
b.callJs(script, waitMs)
b.waitUrl([patterns], ms)
b.block([patterns])
b.getVariable("name")
b.loadHtml(str, ms)
b.html() → doc / b.urls() / b.close()   ← always close!
```

---

## UTILITIES
```js
Console.log(v)          // = Log.log = console.log
sleep(ms)
load("file.js")         // from src/ or URL
Html.clean(str, ["div","p"])
localCookie.setCookie("k=v") / localCookie.getCookie()
localStorage.getItem/setItem  // persistent, max 5MB, wrap in try/catch
Script.execute(code, funcName, param)
Graphics.createCanvas(w,h) / Graphics.createImage(base64)
WebSocket(url, options)
```

---

## CRITICAL RULES
1. nextPage → always string: `String(parseInt(page)+1)` not `parseInt(page)+1`
2. App strips trailing `/` from input URLs — re-add if script needs it
3. Chinese sites: `res.html("gbk")` or `res.text("gbk")`
4. Always `browser.close()` — never skip
5. Normalize all URLs: `//x` → `https://x`, `/path` → `base+path`, relative → `base/`+path
6. `chap.js` returns plain HTML string, not object
7. `ongoing`: true=ongoing, false=completed
8. No async/await — all I/O is synchronous
9. Spread call unsupported: use `.apply()` or loop instead
10. Default params unsupported: use `a = a !== undefined ? a : default` pattern
11. Icon.png check after scaffold is mandatory: Ensure the created icon is a valid image binary, not HTML string.
12. ALWAYS complete the task by updating `AI_CODE_EXT_VBOOK.md` with new findings.
