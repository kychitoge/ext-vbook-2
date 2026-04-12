// gen.js — List/grid of books from a URL
// Contract: execute(url, page) → [{name*, link*, cover?, description?, host?}], nextPage?
// CRITICAL: nextPage MUST be a string, never a number!
function execute(url, page) {
    page = page !== undefined ? page : "1";
    
    // TODO: Add pagination logic (some sites use ?page=N, some use /page/N/)
    let pageUrl = url;
    if (parseInt(page) > 1) {
        pageUrl = url + "?page=" + page;
    }
    
    let response = fetch(pageUrl);
    if (!response.ok) return Response.error("Failed to load: " + pageUrl);
    
    let doc = response.html();
    let data = [];
    
    // Book items on https://truyen.lohi2.com
    doc.select("a.group").forEach(function(el) {
        let name = el.select("h3").text();
        let link = el.attr("href");
        let cover = el.select("img").attr("src");
        let description = el.select("p").first().text();
        
        // Normalize URLs
        if (link && !link.startsWith("http")) link = "https://truyen.lohi2.com" + link;
        if (cover && cover.startsWith("//")) cover = "https:" + cover;
        
        if (name && link) {
            data.push({
                name: name,
                link: link,
                cover: cover || "",
                description: description || "",
                host: "https://truyen.lohi2.com"
            });
        }
    });
    
    // Next page: return null to stop pagination
    let nextPage = null;
    if (data.length > 0) {
        // TODO: Check if there's actually a next page (look for .pagination .next, etc.)
        nextPage = String(parseInt(page) + 1);
    }
    
    return Response.success(data, nextPage);
}
