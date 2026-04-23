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

### Return API
```js
Response.success(data)        // single value
Response.success(data, next)  // data + next (MUST be string)
Response.error("message")
```

### HTTP API
```js
fetch(url)
fetch(url, {method:"POST", headers:{}, body:""})
res.ok / res.status
res.headers["set-cookie"]
res.html() / res.html("gbk") / res.text() / res.json() / res.base64()
Http.get(url).headers({}).queries({}).html()
Http.post(url).headers({}).body("").string()
```

### DOM API (jsoup)
```js
Html.parse(str) → doc
doc.select("css")
el.text() / el.html() / el.attr("name") / el.outerHtml()
el.first() / el.last() / el.get(i) / el.size() / el.length
elements.forEach(fn) / elements.map(fn)
```

### Browser API
```js
var b = Engine.newBrowser();
b.setUserAgent(UserAgent.android|chrome|ios|system)
b.launch(url, timeoutMs)    // sync
b.launchAsync(url); sleep(2500);
b.callJs(script, waitMs)
b.waitUrl([patterns], ms)
b.block([patterns])
b.getVariable("name")
b.html() / b.urls() / b.close()  // always close!
```

### Utilities
```js
console.log(v)
sleep(ms)
load("file.js")
Html.clean(str, ["div","p"])
localCookie.setCookie("k=v") / localCookie.getCookie()
localStorage.getItem/setItem
Script.execute(code, funcName, param)
Graphics.createCanvas(w,h) / Graphics.createImage(base64)
WebSocket(url, options)
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