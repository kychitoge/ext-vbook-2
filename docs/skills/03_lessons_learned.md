# Lessons Learned — Mistakes to Never Repeat

This document captures specific mistakes that were made during extension development and the corrective actions. **Read this BEFORE starting any new extension.**

---

## 1. Icon Verification — ALWAYS Check After Scaffold

**Problem:** The `vbook create` scaffold downloads a favicon automatically. However, if the target site uses an SVG favicon, serves a redirect, or returns HTML instead of an image, the saved `icon.png` will be a corrupted HTML file.

**Rule:** After scaffold, ALWAYS verify `icon.png` is a valid image:
- View the file visually (use `view_file` on binary).
- If it's HTML text or corrupted → manually download the site's actual logo/mascot image as a PNG.
- Target size: ~64x64 pixels PNG.

---

## 2. Regexp Must Be Complete and Strict

**Problem:** Using simple regexp like `domain\\.net/truyen/[^/]+` misses protocol and www support, and doesn't anchor properly.

**Correct pattern:**
```
https?:\/\/(?:www\.)?domain\.net\/truyen\/[a-zA-Z0-9-]+\/?$
```

**Rules:**
- MUST start with `https?:\/\/` to support both http and https
- MUST include `(?:www\.)?` for optional www prefix
- MUST end with `\/?$` to ensure it matches detail pages ONLY
- Use `[a-zA-Z0-9-]+` for slugs, NOT `[^/]+` which is too greedy
- In plugin.json, slashes must be escaped: `https?:\\/\\/(?:www\\\\.)?domain\\\\.net\\/truyen\\/[a-zA-Z0-9-]+\\/?$`
- The `source` field should also escape slashes: `"https:\\/\\/domain.net"`

---

## 3. config.js Must Use `let` and Support CONFIG_URL

**Problem:** Using `const BASE_URL = "..."` prevents VBook from injecting a custom domain.

**Correct pattern:**
```js
let BASE_URL = "https://domain.net";
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}
```

**Why:** VBook injects `CONFIG_URL` globally when the user changes the domain. If `const` is used, this injection fails silently.

---

## 4. URL Normalization is MANDATORY

**Problem:** When a user shares a link from a browser, the URL may have `www.`, `http://`, or other variations. Without normalization, fetch fails.

**Rule:** The FIRST line in `detail.js`, `toc.js`, `chap.js` MUST be:
```js
let url = input.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
```

---

## 5. Discover Internal APIs FIRST — Never Use External SSR APIs

**Problem:** Used an external SSR API (`val-ssr-2kzit.ondigitalocean.app`) instead of discovering the target website's own internal API routes.

**Rule:** ALWAYS check `BASE_URL + "/api/"` endpoints first:
- Try `BASE_URL + "/api/novels/slug/<slug>"` for slug→ID conversion
- Try `BASE_URL + "/api/novels/<id>"` for novel details
- Try `BASE_URL + "/api/novels/search?title=<key>"` for search
- Try `BASE_URL + "/api/comments/novel/<id>"` for comments

**How to discover:** Use the browser subagent to open DevTools → Network tab → filter XHR/Fetch → observe which `/api/` calls the site makes internally.

---

## 6. URL Format: slug-8charID Pattern

**Problem:** Some sites (like valvrareteam.net) use a specific URL format: `slug-<last8charsOfMongoID>`.

**Rule:** When the site uses this pattern:
1. Always implement a `slugify()` helper function:
```js
function slugify(text) {
    return text.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}
```
2. Build URLs as: `slugify(title) + "-" + id.slice(-8)`
3. Parse slugs with: `url.match(/\/truyen\/([^\/]+)/)[1]`

---

## 7. Home Tabs MUST Use `{{page}}` Template

**Problem:** Hardcoding full URLs in home tabs breaks pagination.

**Correct pattern:**
```js
{ title: "Mới cập nhật", input: BASE_URL + "/trang/{{page}}", script: "gen.js" }
```

VBook automatically replaces `{{page}}` with the current page number. NEVER hardcode page numbers.

---

## 8. Next.js SPA Pages Need Engine.newBrowser()

**Problem:** Using `fetch()` on a Next.js SPA page returns only the HTML shell with no rendered content.

**Rule:** If `vbook analyze` reports `nextjs: true`, or the page content is client-side rendered:
- Use `Engine.newBrowser()` + `launchAsync()` + `sleep(2500)` for list pages
- Some pages like detail/toc may still have API alternatives — check `/api/` first

**Pattern:**
```js
let browser = Engine.newBrowser();
browser.launchAsync(url);
sleep(2500);
let html = browser.html();
browser.close();
```

---

## 9. Always Implement Comments If Available

**Problem:** Missed the comment system entirely.

**Rule:** Check if the site has comments by inspecting the network tab. If YES:
1. Create `comment.js` with `execute(input, page)` → `[{name, content, description, avatar}]`
2. In `detail.js`, add:
```js
comments: [{ title: "Bình luận", input: BASE_URL + "/api/comments/novel/" + id + "?page={{page}}", script: "comment.js" }]
```
3. Implement `formatTimeAgo()` for relative timestamps

---

## 10. Genres Must Be Objects With Links, Not Plain Strings

**Problem:** Returned genres as `["Action", "Comedy"]` — these are just labels with no interaction.

**Correct pattern in detail.js:**
```js
genres: novel.genres.map(genre => ({
    title: genre,
    input: BASE_URL + "/danh-sach-truyen/trang/{{page}}?genres=" + encodeURIComponent(genre),
    script: "gen.js"
}))
```

---

## 11. TOC Must Include `pay` Field for VIP Chapters

**Problem:** Didn't mark paid/VIP chapters.

**Rule:** If the site has premium content, add `pay: true/false` to each chapter:
```js
chapList.push({
    name: "[" + volumeTitle + "] " + chapterTitle,
    url: chapterUrl,
    pay: chap.mode === "paid",  // or similar field
    host: BASE_URL
});
```

---

## 12. test-all Pass ≠ Extension Works

**CRITICAL:** `test-all` only tests the chain `home→gen→detail→toc→chap` with auto-picked URLs. It does NOT verify:
- Whether links generated by search.js are valid
- Whether the URL format is correct for the actual website
- Whether icon.png is a real image
- Whether genre.js produces valid pages
- Whether comments work

**Rule:** After `test-all` passes, ALWAYS:
1. Manually test `search.js` and `genre.js` via `vbook debug`
2. Verify icon.png visually
3. Test a REAL URL (not just the auto-generated one)
4. Ideally, deploy and test on the actual VBook app
