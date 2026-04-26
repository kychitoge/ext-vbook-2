load("config.js");

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);

    var b = Engine.newBrowser();
    try {
        b.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        b.launchAsync(url);
        
        for (var i = 0; i < 8; i++) {
            sleep(1000);
            var ready = b.callJs("document.querySelector('video, iframe, .server-list, .player-servers') ? 1 : 0", 1000) + "";
            if (ready === "1") break;
        }
        var html = b.callJs("document.documentElement.outerHTML", 1000) + "";
        
        var doc = Html.parse(html);
        var tracks = [];
        
        var videoEl = doc.select("video").first();
        if (videoEl) {
            var src = (videoEl.attr("src") || videoEl.select("source").attr("src") || "") + "";
            if (src) {
                tracks.push({ title: "Server VIP", data: src });
            }
        }
        
        var iframeEl = doc.select("iframe").first();
        if (iframeEl) {
            var src = (iframeEl.attr("src") || "") + "";
            if (src) {
                tracks.push({ title: "Server Dự Phòng", data: src });
            }
        }
        
        doc.select(".server-list a, .player-servers button").forEach(function(el) {
            var title = (el.text() || "").trim() || "Server";
            var data = (el.attr("data-link") || el.attr("data-src") || el.attr("href") || "") + "";
            if (data) {
                tracks.push({ title: title, data: data });
            }
        });

        if (tracks.length === 0) {
            tracks.push({ title: "Server Default", data: url });
        }

        return Response.success(tracks);
    } finally {
        b.close();
    }
}