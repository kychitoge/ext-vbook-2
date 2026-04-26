load("config.js");

function execute(url, page) {
    if (!page) page = "1";
    var pageUrl = url.replace("{{page}}", page);

    var b = Engine.newBrowser();
    try {
        b.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        b.launchAsync(pageUrl);
        
        for (var i = 0; i < 8; i++) {
            sleep(1000);
            var ready = b.callJs("document.querySelectorAll('a[href^=\"/watch/\"]').length > 0 ? 1 : 0", 1000) + "";
            if (ready === "1") break;
        }
        var html = b.callJs("document.documentElement.outerHTML", 1000) + "";
        
        var doc = Html.parse(html);
        var data = [];
        var urlMap = {};
        var items = doc.select("a[href^='/watch/']");
        
        for (var i = 0; i < items.size(); i++) {
            var el = items.get(i);
            var link = (el.attr("href") || "") + "";
            
            if (urlMap[link] || !link.startsWith("/watch/")) continue;
            
            var name = (el.select("h3").text() || el.text() || "") + "";
            var cover = "";
            var imgEl = el.select("img").first();
            if (imgEl) {
                cover = (imgEl.attr("data-src") || imgEl.attr("src") || "") + "";
                if (cover.startsWith("//")) cover = "https:" + cover;
                if (cover && !cover.startsWith("http")) cover = BASE_URL + cover;
            }
            
            var descEl = el.select("p").first();
            var desc = descEl ? descEl.text() : "";
            
            if (link) {
                urlMap[link] = true;
                data.push({
                    name: name.trim(),
                    link: link.startsWith("http") ? link : BASE_URL + link,
                    cover: cover,
                    description: desc + "",
                    host: BASE_URL
                });
            }
        }
        
        var hasNext = doc.select("button:contains(Tiếp), a:contains(Tiếp), a[rel=next]").size() > 0;
        if (!hasNext && data.length > 0) {
             var pagination = doc.select("nav[aria-label*='pagination'], .pagination");
             if (pagination.size() > 0) {
                 var lastPageEl = pagination.select("a, button").last();
                 var lastPageNum = parseInt((lastPageEl.text() || "") + "");
                 if (!isNaN(lastPageNum) && parseInt(page) < lastPageNum) {
                     hasNext = true;
                 }
             }
        }

        return Response.success(data, hasNext ? String(parseInt(page) + 1) : null);
    } finally {
        b.close();
    }
}