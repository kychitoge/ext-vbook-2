load("config.js");

function execute(url, page) {
    var hash = "18sc35r";
    var episodeId = url;

    load("crypto.js");
    // SvelteKit "devalue" format: 
    // Các giá trị trong object (index 0) thực chất là con trỏ (pointer) trỏ tới các index trong mảng.
    // Do đó "page": 3 có nghĩa là giá trị page thực tế nằm ở index 3 của mảng (tức là parseInt(page) || 1).
    // Nếu để "page": 1, server sẽ hiểu page là "ANIME_EPISODE" và trả về 400 Bad Request.
    var payload = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify([
        { "commentableType": 1, "commentableId": 2, "page": 3, "sort": 4 },
        "ANIME_EPISODE",
        episodeId,
        parseInt(page) || 1,
        "top"
    ])));
    url = BASE_URL + "/_app/remote/" + hash + "/getComments?payload=" + encodeURIComponent(payload);
    console.log(url)

    var res = fetch(url);
    if (res.ok) {
        var text = res.text();
        var root = JSON.parse(text + "");
        var svelteData = root.result || (root.data && root.data.result);
        if (svelteData) {
            var table = [];
            try { eval("table = " + svelteData + ";"); } catch (e) { }
            var indices = table[1];
            var comments = [];

            function resolve(idx) { return (typeof idx === 'number') ? table[idx] : idx; }

            for (var i = 0; i < indices.length; i++) {
                var item = resolve(indices[i]);
                if (item && item.content) {
                    var author = resolve(item.author) || {};
                    var profile = resolve(author.profile) || {};
                    var content = resolve(item.content);
                    var createdAtArr = resolve(item.createdAt);
                    var userName = resolve(author.name) || resolve(author.username);
                    var avatarObj = resolve(profile.avatar);
                    
                    var dateStr = "";
                    if (Array.isArray(createdAtArr) && createdAtArr[0] === "Date") {
                        try {
                            var d = new Date(createdAtArr[1]);
                            if (!isNaN(d.getTime())) dateStr = d.toLocaleString();
                        } catch(e) {}
                    }

                    comments.push({
                        name: userName || "Ẩn danh",
                        content: content ? content.replace(/<[^>]*>?/gm, '').trim() : "",
                        avatar: (avatarObj && resolve(avatarObj.filePath)) ? (IMAGE_URL + resolve(avatarObj.filePath)) : "",
                        description: dateStr
                    });
                }
            }

            var next = (indices.length >= 10) ? (parseInt(page || 1) + 1).toString() : "";
            return Response.success(comments, next);
        }
    }

    return Response.error("Không tải được bình luận");
}
