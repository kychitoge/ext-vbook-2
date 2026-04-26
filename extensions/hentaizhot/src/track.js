load('config.js');

function execute(url) {
    url = (url || "") + "";
    
    if (url.indexOf(".mp4") !== -1 || url.indexOf(".m3u8") !== -1 || url.indexOf(".m3u9") !== -1) {
        return Response.success({
            data: url,
            type: "native",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
                "Referer": BASE_URL + "/"
            },
            host: BASE_URL,
            timeSkip: []
        });
    }

    if (url.indexOf("/play") !== -1 && (url.indexOf("streamqq") !== -1 || url.indexOf("spexliu") !== -1 || url.indexOf("trivonix") !== -1)) {
        var finalUrl = url.split('?')[0];
        finalUrl = finalUrl.replace("e.streamqq.com", "p1.spexliu.top");
        var configUrl = finalUrl.replace("/play", "/config");
        var originUrl = finalUrl.split("/videos")[0];
        
        try {
            var configRes = Http.post(configUrl).body("{}").headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
                'Referer': finalUrl,
                'Content-Type': 'application/json',
                'Origin': originUrl,
                'Accept': 'application/json'
            }).string();

            if (configRes) {
                var json = JSON.parse(configRes);
                if (json && json.sources && json.sources.length > 0) {
                    return Response.success({
                        data: json.sources[0].file,
                        type: "native",
                        headers: {
                            "Referer": finalUrl,
                            "User-Agent": "Mozilla/5.0"
                        },
                        host: BASE_URL,
                        timeSkip: []
                    });
                }
            }
        } catch (e) {}
    }

    // 2. Xử lý sonar-cdn (Server chính của HentaiZ.hot)
    if (url.indexOf("sonar-cdn.com") > -1) {
        var vid = "";
        var m = url.match(/v=([a-f0-9\-]+)/);
        if (m) vid = m[1];

        if (vid) {
            var subdomains = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10"];
            for (var i = 0; i < subdomains.length; i++) {
                var testUrl = "https://" + subdomains[i] + ".animez.top/" + vid + "/master.m3u8";
                try {
                    // Check 200/206 để xác nhận link sống
                    var res = fetch(testUrl, { 
                        method: "GET",
                        headers: { "Range": "bytes=0-1" }
                    });
                    if (res.status === 200 || res.status === 206) {
                        return Response.success({
                            data: testUrl,
                            type: "native",
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
                                "Referer": url
                            },
                            host: "https://sonar-cdn.com",
                            timeSkip: []
                        });
                    }
                } catch(e) {}
            }
        }
    }

    return Response.success({
        data: url,
        type: "auto",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
            "Referer": BASE_URL + "/"
        },
        host: BASE_URL,
        timeSkip: []
    });
}
