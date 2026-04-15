# 04_demo.md — Scripts & Plugin Reference

> Code examples for all script types. Core reference for implementation.

---

## Directory Structure
```
ext-name/
├── plugin.json*
├── icon.png* (64x64)
├── src/
│   ├── detail.js*     (required)
│   ├── toc.js*      (required)
│   ├── chap.js*     (required)
│   ├── home.js     (optional)
│   ├── genre.js    (optional)
│   ├── gen.js     (optional)
│   ├── search.js  (optional)
│   └── page.js   (optional)
```

---

## plugin.json
```json
{
  "metadata": {
    "name": "Tên Extension",
    "author": "B",
    "version": 1,
    "source": "https://domain.net",
    "regexp": "https?:\\/\\/(?:www\\\\.)?domain\\\\.net\\/truyen\\/[a-zA-Z0-9-]+\\\\/?$",
    "description": "Mô tả",
    "locale": "vi_VN",
    "language": "javascript",
    "type": "novel",
    "tag": "nsfw"
  },
  "script": {
    "home": "home.js",
    "genre": "genre.js",
    "detail": "detail.js",
    "search": "search.js",
    "page": "page.js",
    "toc": "toc.js",
    "chap": "chap.js"
  }
}
```

**CRITICAL:**
- `regexp`: MUST match detail page ONLY (end with `\\/?$`)
- `script` paths: NO `src/` prefix
- `author`: read from `vbook-tool/.env`

---

## Script Contracts

| Script | Function Signature | Returns |
|--------|------------------|---------|
| home | `execute()` | `[{title, input, script}]` |
| genre | `execute()` | `[{title, input, script}]` |
| gen | `execute(url, page)` | `[{name*, link*, cover?, description?, host?}], nextPage?` |
| search | `execute(key, page)` | `[{name*, link*, cover?, description?, host?}], nextPage?` |
| detail | `execute(url)` | `{name*, cover, host, author, description, detail, ongoing:bool*, genres?, suggests?, comments?}` |
| page | `execute(url)` | `[urlString, ...]` |
| toc | `execute(url)` | `[{name*, url*, host?}]` |
| chap | `execute(url)` | `htmlString` |
| comment | `execute(input, next)` | `[{name, content, description}], nextCursor?` |
| translate | `execute(text, from, to)` | `string` |
| tts | `execute(text, lang, voice)` | `{audioUrl, text, language}` |

---

## home.js
```js
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL + "/trang/{{page}}", script: "gen.js" },
        { title: "Hot", input: BASE_URL + "/hot", script: "gen.js" },
        { title: "Hoàn thành", input: BASE_URL + "/completed", script: "gen.js" }
    ]);
}
```

---

## gen.js
```js
function execute(url, page) {
    if (!page) page = "1";
    if (url.slice(-1) !== "/") url = url + "/";
    
    let response = fetch(url + page + ".html");
    if (!response.ok) return Response.error("Error: " + response.status);
    
    let doc = response.html();
    const data = [];
    
    doc.select(".book-list .item").forEach(function(el) {
        let name = el.select(".title a").text();
        let link = el.select(".title a").attr("href");
        let cover = el.select("img").attr("src");
        let desc = el.select(".desc").text();
        
        if (name && link) {
            data.push({
                name: name,
                link: link,
                cover: cover ? (cover.startsWith("//") ? "https:" + cover : cover) : null,
                description: desc,
                host: BASE_URL
            });
        }
    });
    
    let nextPage = null;
    let nextLink = doc.select("a.next").attr("href");
    if (nextLink || data.length > 0) {
        nextPage = String(parseInt(page) + 1);
    }
    
    return Response.success(data, nextPage);
}
```

---

## search.js
```js
function execute(key, page) {
    if (!page) page = "1";
    
    let response = fetch(BASE_URL + "/tim-kiem/", {
        queries: { tukhoa: key, page: page }
    });
    if (!response.ok) return Response.error("Search failed");
    
    let doc = response.html();
    const data = [];
    
    doc.select(".search-result .item").forEach(function(el) {
        data.push({
            name: el.select(".title").text(),
            link: el.select("a").attr("href"),
            cover: el.select("img").attr("src"),
            description: el.select(".desc").text(),
            host: BASE_URL
        });
    });
    
    return Response.success(data, data.length > 0 ? String(parseInt(page) + 1) : null);
}
```

---

## detail.js
```js
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);
    
    let doc = response.html();
    
    let name = doc.select("h1.title").text() + "";
    let cover = (doc.select(".cover img").first() ? doc.select(".cover img").attr("src") : "") + "";
    let author = doc.select(".author").text() + "";
    let status = doc.select(".status").text() + "";
    let description = doc.select(".description").html() + "";
    let detail = "Tác giả: " + author + "<br>Trạng thái: " + status;
    let ongoing = !status.includes("Hoàn thành") && !status.includes("Completed");
    
    if (cover.startsWith("//")) cover = "https:" + cover;
    
    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: [
            { title: "Action", input: BASE_URL + "/genre/action", script: "gen.js" }
        ],
        suggests: [
            { title: "Cùng tác giả", input: BASE_URL + "/author/" + author, script: "gen.js" }
        ]
    });
}
```

---

## toc.js
```js
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);
    
    let doc = response.html();
    const chapters = [];
    
    doc.select(".chapter-list a").forEach(function(el) {
        let name = el.text() + "";
        let chapterUrl = el.attr("href") + "";
        
        if (name && chapterUrl) {
            if (!chapterUrl.startsWith("http")) {
                chapterUrl = chapterUrl.startsWith("/") ? BASE_URL + chapterUrl : BASE_URL + "/" + chapterUrl;
            }
            chapters.push({
                name: name,
                url: chapterUrl,
                host: BASE_URL
            });
        }
    });
    
    if (chapters.length === 0) {
        return Response.error("No chapters found");
    }
    
    return Response.success(chapters);
}
```

---

## chap.js
```js
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);
    
    let doc = response.html();
    
    doc.select(".ads, .advertisement, script, style").remove();
    
    let content = doc.select("#content").html() + "";
    if (!content) content = doc.select(".chapter-content").html() + "";
    
    if (!content) return Response.error("No content found");
    
    content = content.replace(/&nbsp;/g, " ");
    content = content.replace(/\s+/g, " ");
    content = content.trim();
    
    return Response.success(content);
}
```

---

## config.js (Required Pattern)
```js
let BASE_URL = "https://domain.net";
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch(e) {}
```

---

## utils.js (Common Helpers)
```js
function cleanText(text) {
    if (!text) return "";
    return text.toString()
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeUrl(url, base) {
    if (!url) return "";
    if (url.startsWith("//")) return "https:" + url;
    if (url.startsWith("/")) return base + url;
    if (!url.startsWith("http")) return base + "/" + url;
    return url;
}

function slugify(text) {
    return text.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}
```