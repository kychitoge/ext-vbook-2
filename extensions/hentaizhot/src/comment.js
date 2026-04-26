load("config.js");

function execute(url, page) {
    if (!page) page = "1";
    
    var b = Engine.newBrowser();
    try {
        b.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        b.launchAsync(url);
        
        for (var i = 0; i < 8; i++) {
            sleep(1000);
            var ready = b.callJs("document.querySelector('article') ? 1 : 0", 1000) + "";
            if (ready === "1") break;
        }
        var html = b.callJs("document.documentElement.outerHTML", 1000) + "";
        
        var doc = Html.parse(html);
        var data = [];
        var els = doc.select("article");
        var list = [];
        for (var i = 0; i < els.length; i++) {
            var e = els.get(i);
            var avatar = "";
            var avatarEl = e.select("img[data-slot='avatar-image']").first();
            if (avatarEl) {
                avatar = avatarEl.attr("src") || "";
            } else {
                avatarEl = e.select("img").first();
                if (avatarEl) avatar = avatarEl.attr("src") || "";
            }
            
            var name = (e.select("h3").first().text() || e.select("span.font-medium").first().text() || "") + "";
            var content = (e.select("p.leading-relaxed").first().text() || "") + "";
            var time = (e.select("span.text-muted-foreground").first().text() || "") + "";
            
            if (!name) continue;
            
            list.push({
                name: name,
                avatar: avatar,
                content: content,
                time: time
            });
        }
        
        var hasMore = doc.select("button:contains(Xem thêm), button:contains(Load more)").size() > 0;
        
        var next = "";
        if (hasMore) {
            next = (parseInt(page) + 1).toString();
        }
        
        return Response.success(list, next);
    } finally {
        b.close();
    }
}