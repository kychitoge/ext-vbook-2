// genre.js (Comic)
// Contract: execute() → [{ title, input, script }]
function execute() {
    // TODO: Thay PATH_THELOAI bằng URL trang thể loại thực tế
    var res = fetch(BASE_URL + "/PATH_THELOAI");
    if (!res.ok) return Response.error("Cannot load genres");

    var doc = res.html();
    var genres = [];

    // TODO: Selector các thẻ <a> của từng thể loại
    doc.select("SELECTOR_GENRE_LINKS").forEach(function(el) {
        var title = el.text() + "";
        var href  = (el.attr("href") || "") + "";
        if (!title || !href) return;
        if (!href.startsWith("http")) href = BASE_URL + href;
        genres.push({ title: title, input: href, script: "gen.js" });
    });

    return Response.success(genres);
}
