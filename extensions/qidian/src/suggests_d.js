function execute(input) {
    let doc = Html.parse(input);
    let books = [];
    let cover = doc.select("img")
    doc.select("a").forEach(e => {
        books.push({
            name: e.text(),
            link: "https://www.qidian.com/book/" + e.attr("href").match(/\d+/g)[0] + "/",
            cover:  "https:" +  cover.attr("src"),
        })
    });
    return Response.success(books);
}