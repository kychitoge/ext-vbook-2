# 01_runtime.md — Rhino 1.7.14 Runtime Context

> Single source of truth for Rhino ES6 constraints. DO NOT duplicate elsewhere.

## Runtime Constraints (Rhino 1.7.14)

### ✅ SUPPORTED
- `var` / `let` / `const`
- Arrow functions: `() => {}`
- Template literals: `` `text ${var}` ``
- `for..of` loops
- Basic destructuring: `const {a, b} = obj`
- `Promise` (basic)
- `class`, `Map`, `Set`, `Symbol`, `WeakMap`
- Generator functions: `function*`
- Shorthand methods: `{ method() {} }`
- Computed property names: `{ [key]: value }`

### ❌ UNSUPPORTED — DO NOT USE

| Pattern | Wrong | Correct |
|---------|-------|---------|
| Spread in function call | `Math.max(...arr)` | `Math.max.apply(null, arr)` |
| Spread in array literals | `[...arr]` | `arr.slice()` or `[].concat(arr)` |
| Default parameters | `function f(a=1)` | `a = a !== undefined ? a : 1` |
| async/await | ❌ | Synchronous only |
| Optional chaining | `obj?.prop` | `obj && obj.prop` |
| Nullish coalescing | `a ?? b` | `a != null ? a : b` |
| Array destructuring rest | `[a, ...rest]` | Use loop instead |
| import/export | ❌ | Use `load("file.js")` |
| String.matchAll | ❌ | Use `exec()` in loop |
| Promise.allSettled/Promise.any | ❌ | Use Promise.all |

### ⚠️ CRITICAL RULES

1. **nextPage** → always string: `String(parseInt(page) + 1)` not `parseInt(page) + 1`
2. **App strips trailing `/`** from input — re-add if script needs it
3. **Chinese sites**: use `res.html("gbk")` or `res.text("gbk")`
4. **Always `browser.close()`** — use `try/finally`
5. **URL normalization**: `//x` → `https://x`, `/path` → `base+path`
6. **chap.js** returns plain HTML string, not object
7. **`ongoing`**: `true` = ongoing, `false` = completed
8. **Java String serialization**: Add `+ ""` after ALL `.text()/.attr()/.html()` to avoid `data: null`
9. **doc.body()** does NOT exist → use `doc.select("body")`

---

## API Reference

### Response API
```js
Response.success(data)            // → {code: 0, data}
Response.success(data, data2)     // → {code: 0, data, data2}
Response.error(message)           // → {code: 1, data: message}
```

### Fetch API
```js
fetch(url)                                    // GET request
fetch(url, options)                           // Custom request

// Options object structure:
{
  method: "GET|POST",
  headers: {key: value},
  body: "string|Blob",
  timeout: ms,
  queries: {param: value}
}

// Returns HttpResponse object
```

### HttpResponse API (from fetch)
```js
response.ok                       // boolean
response.status                   // number (200, 404, etc)
response.statusText               // string
response.url                      // string (final URL after redirects)
response.headers                  // object {key: value}
response.header(key)              // string (single header value)
response.request                  // HttpRequest object

// Content parsing
response.text()                   // → string
response.text(charset)            // → string (charset: "utf-8", "gbk", etc)
response.html()                   // → HtmlElement (parsed DOM)
response.html(charset)            // → HtmlElement (with encoding)
response.json()                   // → object (parsed JSON)
response.base64()                 // → string (base64 encoded)
response.blob()                   // → Blob object
```

### HttpRequest API (response.request)
```js
request.url                       // string
request.headers                   // object {key: value}
```

### Http Builder API
```js
// GET Request Builder
Http.get(url)
  .headers(obj)                   // add headers
  .params(obj)                    // add query parameters
  .queries(obj)                   // add query parameters
  .timeout(ms)                    // set timeout
  .string(charset)                // → string response
  .html(charset)                  // → HtmlElement
  .blob()                         // → Blob
  .url()                          // → string (URL)

// POST Request Builder
Http.post(url)
  .headers(obj)                   // add headers
  .queries(obj)                   // add query parameters
  .body(data)                     // set request body (string)
  .binary(base64, type)           // set request body (base64 blob)
  .timeout(ms)                    // set timeout
  .string(charset)                // → string response
  .html(charset)                  // → HtmlElement
  .blob()                         // → Blob
  .url()                          // → string (URL)
```

### DOM API (Html)
```js
Html.parse(htmlString)            // → HtmlElement (root document)
```

### HtmlElement API
```js
element.select(cssSelector)       // → HtmlElements (collection)
element.attr(attrName)            // → string
element.text()                    // → string (inner text)
element.html()                    // → string (inner HTML)
element.attributes()              // → object {key: value}
element.remove()                  // remove element from DOM
element.toString()                // → string (same as html())
```

### HtmlElements API (collection)
```js
elements.length                   // number (readonly)
elements.size()                   // → number
elements.isEmpty()                // → boolean
elements.get(index)               // → HtmlElement
elements.first()                  // → HtmlElement
elements.last()                   // → HtmlElement
elements.select(cssSelector)      // → HtmlElements (nested select)
elements.attr(attrName)           // → string[] (all attributes)
elements.text()                   // → string[] (all text)
elements.html()                   // → string[] (all HTML)
elements.remove()                 // remove all elements

// Iteration
elements.forEach(function(el) {}) // el is HtmlElement
elements.map(function(el) {})     // → array
```

### Browser API
```js
var browser = Engine.newBrowser()

// User Agent
browser.setUserAgent(ua)
  // ua options: UserAgent.system(), android(), chrome(), ios()

// Synchronous navigation
browser.launch(url, timeoutMs)    // → HtmlElement (blocks until loaded)
browser.html(timeoutMs)           // → HtmlElement (current HTML)

// Asynchronous navigation
browser.launchAsync(url)          // start loading (non-blocking)
browser.loadHtml(baseUrl, html)   // load HTML string

// Network control
browser.block(patterns)           // block URLs: ["*.png", "*.jpg", "*.woff2"]
browser.waitUrl(patterns, ms)     // wait for URL pattern to load
browser.urls()                    // → string[] (captured URLs)

// JavaScript execution
browser.callJs(script, timeoutMs) // → HtmlElement (execute JS, get result)
browser.getVariable(name)         // → any (get JS variable value)

// Cleanup
browser.close()                   // close browser (required!)
```

### Engine API
```js
Engine.newBrowser()               // → Browser object
```

### UserAgent API
```js
UserAgent.system()                // → string (system default UA)
UserAgent.android()               // → string (Android UA)
UserAgent.chrome()                // → string (Chrome desktop UA)
UserAgent.ios()                   // → string (iOS/iPhone UA)
```

### Blob API
```js
Blob.fromBase64(base64, type)     // → Blob object
  // Example: Blob.fromBase64("base64data...", "image/png")

// Blob properties
blob._isBlob                      // boolean (true)
blob._base64                      // string (encoded data)
blob.type                         // string (MIME type)
blob.size                         // number (bytes)
blob.base64()                     // → string
blob.toString()                   // → string (same as base64())
```

### Graphics API
```js
Graphics.createCanvas(width, height)  // → Canvas object
Graphics.createImage(base64)          // → Image object

// Canvas methods
canvas.drawImage(image, x, y)         // 3 params: image, x, y
canvas.drawImage(image, x, y, w, h)   // 5 params: + width, height
canvas.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)  // 9 params: source + dest
canvas.capture()                      // → base64 string (screenshot)

// Image properties
image.width                       // number (pixels)
image.height                      // number (pixels)
```

### Storage APIs
```js
// LocalStorage (persistent across requests)
localStorage.setItem(key, value)
localStorage.getItem(key)         // → value or null
localStorage.removeItem(key)
localStorage.clear()

// Cache Storage (session-based cache)
cacheStorage.setItem(key, value)
cacheStorage.getItem(key)         // → value or null
cacheStorage.removeItem(key)
cacheStorage.clear()

// Local Cookie (persist cookies)
localCookie.setCookie(cookieStr)  // e.g., "session=abc123; path=/"
localCookie.getCookie()           // → string (full cookie string)

// Local Config (read-only config)
localConfig.getItem(key)          // → config value or null
```

### WebSocket API
```js
var ws = new WebSocket(url, headersObj)

// Properties
ws.url                            // string
ws.headers                        // object
ws.readyState                     // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
ws.CONNECTING                     // = 0
ws.OPEN                           // = 1
ws.CLOSING                        // = 2
ws.CLOSED                         // = 3

// Methods
ws.connect()                      // → ws (connect and set readyState to OPEN)
ws.send(data)                     // string or buffer
ws.sendText(message)              // → response
ws.sendBuffer(buffer)             // → response
ws.message()                      // → WebSocketFrame {type, data}
ws.receive()                      // → WebSocketFrame (same as message())
ws.close()                        // close connection (sets readyState to CLOSED)

// WebSocketFrame properties
frame.type                        // string (message type)
frame.data                        // string or buffer (message content)
```

### Console & Logging API
```js
console.log(message)              // log to console
Log.log(message)                  // same as console.log()
sleep(milliseconds)               // pause execution
```

### Script API
```js
Script.execute(scriptCode, functionName, inputParam)
  // Execute external script code
  // Returns result from functionName(inputParam)
```

### Utilities API
```js
load(filePath)                    // Load and execute external script file
  // Example: load("helper.js")

Html.clean(htmlString, tagArray) // Clean HTML by removing specified tags
  // Example: Html.clean("<p>text</p><div>content</div>", ["div"])
  // → "<p>text</p>"
```

---

## Cookie & Session Pattern
```js
var res = fetch(url);
var setCookie = res.headers["set-cookie"];
try { localStorage.setItem("my_cookie", setCookie); } catch(e) {}
var savedCookie = "";
try { savedCookie = localStorage.getItem("my_cookie") || ""; } catch(e) {}
var res2 = fetch(url2, { headers: { "Cookie": savedCookie } });
```

---

## Browser Pattern (Standard)
```js
var b = Engine.newBrowser();
try {
    b.setUserAgent(UserAgent.android);
    b.block(["*.png", "*.jpg", "*.gif", "*.woff"]);
    b.launch(url, 12000);
    var doc = b.html();
} finally {
    b.close();
}
```

---

## Browser API Discovery Pattern
```js
var b = Engine.newBrowser();
try {
    b.setUserAgent(UserAgent.android);
    b.launchAsync(url);
    sleep(3000);
    var capturedUrls = b.urls();
    var apiCalls = [];
    capturedUrls.forEach(function(u) {
        if (u.indexOf("/api/") > -1 || u.indexOf(".json") > -1) {
            apiCalls.push(u);
        }
    });
    return Response.success(apiCalls);
} finally {
    b.close();
}
```