load('config.js');
function execute(url) {
    url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL)
    let doc = fetch(url).text();
    let token_ = doc.match(/_token = '(.*?)';/g)[0].replace("_token = '", "").replace("';", "");
    let chapterId = doc.match(/chapterId = '(.*?)';/)[0].replace("chapterId = '", "").replace("';", "");
    let cookies = doc.match(/cookies:\s*'([^']+)'/)[0].replace("cookies: '", "").replace("'", "");
    var response = fetch("https://daomeoden.net/apps/controllers/book/bookChapterContent.php", {
        method: "POST",
        body: {
            "chapterId": chapterId,
            "cookies": cookies,
            "token": token_
        },
    });

    let json = response.json();
    let datajson = Html.parse(json.data);
    var el = datajson.select("img.w-100");
    var data = [];
    for (var i = 0; i < el.size(); i++) {
        var e = el.get(i);
        data.push("https:" + e.attr("data-src"));
    }
    return Response.success(data);
}
