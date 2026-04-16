// gen.js (Comic) — Danh sách truyện tranh
// Contract: execute(url, page) → [{name*, link*, cover?, description?, host?}], nextPage?
// QUAN TRỌNG: nextPage phải là string, không phải số!
function execute(url, page) {
    if (!page) page = "1";

    // TODO: Điều chỉnh cách phân trang theo site
    // Kiểu path:  url.replace("{{page}}", page)
    // Kiểu query: url + "?page=" + page
    var pageUrl = url.replace("{{page}}", page);

    var res = fetch(pageUrl);
    if (!res.ok) return Response.error("Cannot load: " + res.status);

    var doc = res.html();
    var data = [];
    var seen = {};

    // TODO: [1] Selector container mỗi bộ manga/comic trong danh sách
    doc.select("SELECTOR_ITEM").forEach(function(el) {

        // TODO: [2] Selector thẻ <a> tên + link — trong container trên
        var linkEl = el.select("SELECTOR_TITLE_LINK").first();

        // TODO: [3] Selector thẻ <img> ảnh bìa — ưu tiên data-src (lazy-load)
        var imgEl  = el.select("img").first();

        if (!linkEl) return;
        var link = (linkEl.attr("href") || "") + "";
        if (!link || seen[link]) return;
        seen[link] = true;

        if (!link.startsWith("http")) link = BASE_URL + link;
        var cover = imgEl ? ((imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || imgEl.attr("src") || "") + "") : "";
        if (cover.startsWith("//")) cover = "https:" + cover;

        data.push({
            name:        linkEl.text().trim() + "",
            link:        link,
            cover:       cover,
            description: "",
            host:        BASE_URL
        });
    });

    // TODO: [4] Selector nút/link trang tiếp theo
    var hasNext = doc.select("SELECTOR_NEXT_PAGE").size() > 0;
    var nextPage = hasNext ? String(parseInt(page) + 1) : null;

    return Response.success(data, nextPage);
}
