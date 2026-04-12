load('config.js');
function execute(url, page) {
    if (!page) page = '1';
    let lUrl = BASE_URL + url
    console.log(lUrl);
    let doc = fetch(lUrl).text();
    let token_ = doc.match(/_token = '(.*?)';/g)[0].replace("_token = '", "").replace("';", "");
    var groupId = doc.match(/<input[^>]*id=["']tagIdCurrent["'][^>]*value=["'](\d+)["']/);
    console.log(groupId[1]);
    console.log(token_);
    if (groupId !== null) {
        var response = fetch("https://daomeoden.net/apps/controllers/genre/list.php", {
            method: "POST",
            body: {
                "index": "0",
                "page": page,
                "genre": groupId[1],
                "token": token_
            },
        });
    } else {
        response = fetch(`https://daomeoden.net/apps/controllers/group/listUpdate.php`, {
            method: "POST",
            body: {
                "index": "0",
                "page": page,
                "groupId": "1",
                "token": token_
            },

        });
    }
    let json = response.json();
    let datajson = Html.parse(json.data);
    var next = json.page
    console.log(next);
    const el = datajson.select(".col-4.item-list")
    const data = [];
    for (var i = 0; i < el.size(); i++) {
        var e = el.get(i);
        var coverImg = e.select(".item-cover img").first().attr("src")
        if (coverImg.startsWith('//')) coverImg = coverImg.replace('//', 'https://')
        data.push({
            name: capitalizeWords(e.select(".item-title").first().text()),
            link: e.select(".item-title a").first().attr("href"),
            cover: coverImg,
            description: e.select('.item-sub').text().trim().replace(/\s+/g, ' '),
            host: BASE_URL
        })
    }

    return Response.success(data, next)
}
