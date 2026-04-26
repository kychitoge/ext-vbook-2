load("config.js");

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    var slug = url.split('/').pop();

    var cached = cacheStorage.getItem("cached_toc_" + slug);
    if (cached) {
        var table = [];
        try { eval("table = " + cached + ";"); } catch(e) {}
        var resArr = parseSvelteTable(table);
        if (resArr && resArr.length > 0) return Response.success(resArr);
    }
    return Response.error("Không tìm thấy mục lục");
}

function parseSvelteTable(table) {
    var data = table;
    var indices = table[1]; 
    if (!indices || !Array.isArray(indices)) return [];

    function resolve(idx) { return (typeof idx === 'number') ? data[idx] : idx; }

    var chapters = [];
    for (var i = 0; i < indices.length; i++) {
        var item = resolve(indices[i]);
        if (item && item.slug) {
            var slug = resolve(item.slug);
            chapters.push({
                name: "Tập " + (i + 1),
                url: BASE_URL + "/watch/" + slug,
                host: BASE_URL
            });
        }
    }
    return chapters;
}
