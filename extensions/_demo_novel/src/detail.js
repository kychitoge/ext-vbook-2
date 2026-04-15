function execute(url) {
    // Novel: extract detailed book info with genres, suggests, comments
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);
    
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);
    
    let doc = response.html();
    
    let name = doc.select("h1.title, .ten-truyen, h1.book-title").text() + "";
    let coverEl = doc.select(".cover img, .anh-bia img, .book-cover img").first();
    let cover = coverEl ? (coverEl.attr("src") + "") : "";
    
    let authorEl = doc.select(".author, .tac-gia, [itemprop=author]").first();
    let author = authorEl ? (authorEl.text() + "") : "";
    
    let statusEl = doc.select(".status, .trang-thai").first();
    let status = statusEl ? (statusEl.text() + "") : "";
    
    let descEl = doc.select(".description, .gioi-thieu, .novel-desc").first();
    let description = descEl ? (descEl.html() + "") : "";
    
    if (cover.startsWith("//")) cover = "https:" + cover;
    
    let ongoing = !status.includes("Hoàn thành") && !status.includes("Completed") && 
                 !status.includes("Hoàn") && !status.includes("End");
    
    let detail = "Tác giả: " + author + "<br>";
    detail += "Trạng thái: " + status + "<br>";
    detail += doc.select(".info, .thong-tin").text() + "";
    
    // Genres as objects with links
    const genres = [];
    doc.select(".genre a, .the-loai a, .tags a").forEach(function(el) {
        let gTitle = el.text() + "";
        let gHref = el.attr("href") + "";
        if (gTitle && gHref) {
            genres.push({
                title: gTitle,
                input: BASE_URL + gHref,
                script: "gen.js"
            });
        }
    });
    
    // Suggests (same author or related)
    const suggests = [];
    doc.select(".same-author a, .lien-quan a, .suggests a").forEach(function(el) {
        let sTitle = el.text() + "";
        let sHref = el.attr("href") + "";
        if (sTitle && sHref) {
            suggests.push({
                title: sTitle,
                input: BASE_URL + sHref,
                script: "gen.js"
            });
        }
    });
    
    // Comments (if available)
    const comments = [];
    let commentApi = doc.select("[data-comments-api]").attr("data-comments-api") + "";
    if (commentApi) {
        comments.push({
            title: "Bình luận",
            input: commentApi,
            script: "comment.js"
        });
    }
    
    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres.length > 0 ? genres : undefined,
        suggests: suggests.length > 0 ? suggests : undefined,
        comments: comments.length > 0 ? comments : undefined
    });
}