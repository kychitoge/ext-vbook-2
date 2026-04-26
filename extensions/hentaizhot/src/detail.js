load("config.js");

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    var b = Engine.newBrowser();
    try {
        b.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        b.launchAsync(url);
        
        for (var i = 0; i < 8; i++) {
            sleep(1000);
            var ready = b.callJs("document.querySelector('h2.leading-tight') ? 1 : 0", 1000) + "";
            if (ready === "1") break;
        }
        var html = b.callJs("document.documentElement.outerHTML", 1000) + "";
        
        var doc = Html.parse(html);
        
        var name = (doc.select("h2.leading-tight").first().text() || "") + "";
        var cover = "";
        var coverEl = doc.select("video").first();
        if (coverEl && coverEl.attr("poster")) {
            cover = coverEl.attr("poster") + "";
        } else {
            coverEl = doc.select("img.aspect-video, img[src*='storage']:not([alt='HentaiZ'])").first();
            if (coverEl) {
                cover = (coverEl.attr("data-src") || coverEl.attr("src") || "") + "";
            }
        }
        if (cover.startsWith("//")) cover = "https:" + cover;
        if (cover && !cover.startsWith("http")) cover = BASE_URL + cover;

        var author = (doc.select("a[href^='/studios/']").first().text() || "") + "";
        var description = (doc.select("div.mt-4.text-gray-400").first().html() || "") + "";
        
        var genres = [];
        doc.select("a[href^='/genres/']").forEach(function(el) {
            var gTitle = (el.text() || "").trim();
            var gHref = (el.attr("href") || "") + "";
            if (gTitle && gHref) {
                if (!gHref.startsWith("http")) gHref = BASE_URL + gHref;
                genres.push({ title: gTitle, input: gHref, script: "gen.js" });
            }
        });

        var comments = [
            { title: "Bình luận", input: url, script: "comment.js" }
        ];

        return Response.success({
            name: name.trim(),
            cover: cover,
            host: BASE_URL,
            author: author.trim(),
            description: description.trim(),
            ongoing: false,
            genres: genres.length > 0 ? genres : undefined,
            comments: comments
        });
    } finally {
        b.close();
    }
}