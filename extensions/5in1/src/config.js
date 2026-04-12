function get_csrfToken() {
    var cached = localStorage.getItem("_csrfToken");
    if (cached) return cached;

    var _csrfToken = null;

    // 1️⃣ Thử lấy từ cookie
    var response = fetch("https://my.qidian.com/author/9639927/");
    var cookie = response.request.headers.cookie;
    console.log(cookie);

    if (cookie) {
        var m1 = cookie.match(/_csrfToken=[^;]+/);
        if (m1) _csrfToken = m1[0];
    }

    // 2️⃣ Fallback: lấy từ browser.urls
    if (!_csrfToken) {
        var browser = Engine.newBrowser();
        browser.launch("https://my.qidian.com/author/9639927/", 10000);

        var urls = browser.urls();
        browser.close();
        console.log("1111");
        // browser.urls() có thể là NativeArray hoặc string
        if (typeof urls === "string") {
            urls = JSON.parse(urls);
        }

        for (var i = 0; i < urls.length; i++) {
            var u = urls[i];
            if (u.indexOf("_csrfToken") === -1) continue;

            u = u.replace(/\\u003d/g, "=").replace(/\\u0026/g, "&");

            var m2 = u.match(/_csrfToken=[^&]+/);
            if (m2) {
                _csrfToken = m2[0];
                break;
            }
        }
    }

    if (!_csrfToken) {
        throw "Không lấy được _csrfToken";
    }

    localStorage.setItem("_csrfToken", _csrfToken);
    return _csrfToken;
}
function get_device() {
    if (!localStorage.getItem("id2")) {
        let response = fetch("https://api.langge.cf/user");
        let doc = response.request.headers.cookie
        if (doc == undefined) {
            return undefined
        }
        localStorage.setItem("id2", doc)
    }
    return localStorage.getItem("id2")
}