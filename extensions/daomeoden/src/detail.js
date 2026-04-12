load('config.js');
function execute(url) {
    url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL)
    var response = fetch(url);
    let genres = [];
    if (response.ok) {
        var doc = response.html();
        let author = doc.select('.author-content').first();
        let tag = doc.select('.flex-wrap.mt-2 a');
        tag.forEach(e => {
            genres.push({
                title: e.text(),
                input: e.attr("href").replace(BASE_URL, ""),
                script: "gen.js"
            })
        })
        let coverImg = doc.select(".info-cover-img > img:nth-child(1)").attr("src");
        if (coverImg.startsWith('//')) coverImg = coverImg.replace('//', 'https://');
        return Response.success({
            name: capitalizeWords(doc.select(".info-name").text()),
            cover: coverImg,
            author: author.text(),
            description: doc.select("div.content").html(),
            genres: genres,
            host: BASE_URL,
        });
    }
    return null;
}
