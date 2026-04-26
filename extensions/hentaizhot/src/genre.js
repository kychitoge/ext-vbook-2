load("config.js");

function execute() {
    var b = Engine.newBrowser();
    try {
        b.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        b.launchAsync(BASE_URL + "/genres");
        
        for (var i = 0; i < 8; i++) {
            sleep(1000);
            var ready = b.callJs("document.querySelectorAll('a[href^=\"/genres/\"]').length > 0 ? 1 : 0", 1000) + "";
            if (ready === "1") break;
        }
        var html = b.callJs("document.documentElement.outerHTML", 1000) + "";
        
        var doc = Html.parse(html);
        var genres = [];
        
        doc.select("a[href^='/genres/']").forEach(function(el) {
            var title = (el.text() || "").trim() + "";
            var href = (el.attr("href") || "") + "";
            if (title && href) {
                if (!href.startsWith("http")) href = BASE_URL + href;
                genres.push({ title: title, input: href + "?page={{page}}", script: "gen.js" });
            }
        });
        
        return Response.success(genres);
    } finally {
        b.close();
    }
}