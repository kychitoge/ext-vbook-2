load('config.js');
function execute(url, page) {
    if (!page) page = '1';
    let lUrl = BASE_URL + url
    let response = fetch(lUrl);
    let doc = response.html();
    const el = doc.select(".col-4.item-list")
    const data = [];
    for (var i = 0; i < el.size(); i++) {
        var e = el.get(i);
        var coverImg = e.select(".item-cover img").first().attr("src")
        data.push({
            name: capitalizeWords(e.select(".item-title").first().text()),
            link: e.select(".item-title a").first().attr("href"),
            cover: "https:" + coverImg,
            description: e.select('.item-sub').text().trim().replace(/\s+/g, ' '),
            host: BASE_URL
        })
    }

    return Response.success(data)
}
