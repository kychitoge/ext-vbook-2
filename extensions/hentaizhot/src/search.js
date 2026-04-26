load("config.js");

function execute(key, page) {
    if (!page) page = "1";
    var searchUrl = BASE_URL + "/browse?q=" + encodeURIComponent(key) + "&page=" + page;

    var b = Engine.newBrowser();
    try {
        b.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        b.launchAsync(searchUrl);
        
        for (var i = 0; i < 8; i++) {
            sleep(1000);
            var ready = b.callJs("document.querySelectorAll('a[href^=\"/watch/\"]').length > 0 ? 1 : 0", 1000) + "";
            if (ready === "1") break;
        }
        var html = b.callJs("document.documentElement.outerHTML", 1000) + "";
        
        var doc = Html.parse(html);
        var data = [];
        
        doc.select("a[href^='/watch/']").forEach(function(el) {
            var link = (el.attr("href") || "") + "";
            if (link && !link.startsWith("http")) link = BASE_URL + link;
            var name = (el.select("h3").text() || el.text() || "") + "";
            var cover = "";
            var imgEl = el.select("img").first();
            if (imgEl) {
                cover = (imgEl.attr("data-src") || imgEl.attr("src") || "") + "";
                if (cover.startsWith("//")) cover = "https:" + cover;
                if (cover && !cover.startsWith("http")) cover = BASE_URL + cover;
            }
            
            if (link) {
                data.push({
                    name: name.trim(),
                    link: link,
                    cover: cover,
                    description: (el.select("p").first().text() || "") + "",
                    host: BASE_URL
                });
            }
        });
        
        var hasNext = doc.select("button:contains(Tiếp), a:contains(Tiếp), a[rel=next]").size() > 0;
        return Response.success(data, hasNext ? String(parseInt(page) + 1) : null);
    } finally {
        b.close();
    }
}