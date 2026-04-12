// detail.js — Book detail page
// Contract: execute(url) → {name*, cover, host, author, description, detail, ongoing:bool*,
//                           genres?:[{title,input,script}], suggests?:[{title,input,script}]}
function execute(url) {
    // NOTE: App strips trailing / from URL — re-add if needed
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load detail page");
    
    let doc = response.html();
    
    // Selector for https://truyen.lohi2.com
    let name = doc.select("h1").text();
    let cover = doc.select("img[src*='/truyen/']").attr("src");
    // Author is the second p after h1
    let author = doc.select("h1 ~ p").get(1).text();
    let description = doc.select("div:contains(GIỚI THIỆU) + div").html();
    let status = "";
    
    // Normalize cover URL
    if (cover && cover.startsWith("//")) cover = "https:" + cover;
    if (cover && !cover.startsWith("http")) cover = "https://truyen.lohi2.com" + cover;
    
    // Determine ongoing status
    let ongoing = true;
    if (status && (status.indexOf("Hoàn") >= 0 || status.indexOf("Full") >= 0 || 
        status.indexOf("完结") >= 0 || status.indexOf("Completed") >= 0)) {
        ongoing = false;
    }
    
    // Build genres array for clickable tags
    let genres = [];
    doc.select(".genre a, .tag a, .info a[href*=the-loai]").forEach(function(el) {
        genres.push({
            title: el.text(),
            input: el.attr("href").startsWith("http") ? el.attr("href") : "https://truyen.lohi2.com" + el.attr("href"),
            script: "gen.js"
        });
    });
    
    // Build suggests for "Cùng tác giả" 
    let suggests = [];
    if (author) {
        suggests.push({
            title: "Cùng tác giả: " + author,
            input: author,
            script: "search.js"
        });
    }
    
    return Response.success({
        name: name,
        cover: cover || "",
        host: "https://truyen.lohi2.com",
        author: author || "",
        description: description || "",
        detail: "Tác giả: " + author + "<br>Trạng thái: " + status,
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}
