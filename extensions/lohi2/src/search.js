// search.js — Search for books
// Contract: execute(key, page) → [{name*, link*, cover?, description?, host?}], nextPage?
function execute(key, page) {
    page = page !== undefined ? page : "1";
    
    // TODO: Update search URL pattern for https://truyen.lohi2.com
    let url = "https://truyen.lohi2.com/search?q=" + encodeURIComponent(key) + "&page=" + page;
    
    let response = fetch(url);
    if (!response.ok) return Response.error("Search failed");
    
    let doc = response.html();
    let data = [];
    
    // TODO: Update CSS selectors for search results
    doc.select(".search-result .item, .list-truyen .row").forEach(function(el) {
        let name = el.select("h3 a, .title a").text();
        let link = el.select("h3 a, .title a").attr("href");
        let cover = el.select("img").attr("src");
        
        if (link && !link.startsWith("http")) link = "https://truyen.lohi2.com" + link;
        if (cover && cover.startsWith("//")) cover = "https:" + cover;
        
        if (name && link) {
            data.push({
                name: name,
                link: link,
                cover: cover || "",
                description: el.select(".text-muted, .desc").text(),
                host: "https://truyen.lohi2.com"
            });
        }
    });
    
    let nextPage = data.length > 0 ? String(parseInt(page) + 1) : null;
    return Response.success(data, nextPage);
}
