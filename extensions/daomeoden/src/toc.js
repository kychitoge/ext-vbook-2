load('config.js');
function execute(url) {
    url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL)
    let response = fetch(url);
    let doc = response.html();
     var el = doc.select("#TabChapterChapter .chapter");
    const data = [];
    for (var i = el.size() - 1; i >= 0 ; i--) {
        var e = el.get(i);
        data.push({
            name: e.select(".name-sub").text(),
            url: e.attr("onclick").replace("openUrl('", "").replace("')", ""),
            host: BASE_URL
        })
    }

    return Response.success(data);
}
