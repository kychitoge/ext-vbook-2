function execute(url) {
    // Comic: often has volumes/tap, different layout than novels
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);
    
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);
    
    let doc = response.html();
    
    let name = doc.select("h1.title, .ten-truyen, h1.comic-title").text() + "";
    let coverEl = doc.select(".cover img, .anh-bia img, .comic-cover img").first();
    let cover = coverEl ? (coverEl.attr("src") + "") : "";
    
    let authorEl = doc.select(".author, .tac-gia").first();
    let author = authorEl ? (authorEl.text() + "") : "";
    
    let statusEl = doc.select(".status, .trang-thai").first();
    let status = statusEl ? (statusEl.text() + "") : "";
    
    let descEl = doc.select(".description, .gioi-thieu").first();
    let description = descEl ? (descEl.html() + "") : "";
    
    if (cover.startsWith("//")) cover = "https:" + cover;
    
    let ongoing = !status.includes("Hoàn thành") && !status.includes("Completed");
    
    let detail = "Tác giả: " + author + "<br>";
    detail += "Trạng thái: " + status + "<br>";
    detail += doc.select(".info, .thong-tin").text() + "";
    
    // Genres
    const genres = [];
    doc.select(".genre a, .the-loai a").forEach(function(el) {
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
    
    // Suggests
    const suggests = [];
    doc.select(".same-author a, .lien-quan a").forEach(function(el) {
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
    
    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres.length > 0 ? genres : undefined,
        suggests: suggests.length > 0 ? suggests : undefined
    });
}