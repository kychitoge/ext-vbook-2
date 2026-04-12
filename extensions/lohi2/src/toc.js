// toc.js — Table of contents (chapter list)
// Contract: execute(url) → [{name*, url*, host?}]
function execute(url) {
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load TOC");
    
    let doc = response.html();
    let chapters = [];
    
    // Chapter list on https://truyen.lohi2.com
    doc.select("a[href*='/chuong-']").forEach(function(el) {
        let name = el.text().trim();
        let chapUrl = el.attr("href");
        
        if (!name || !chapUrl) return;
        
        // Normalize URL
        if (!chapUrl.startsWith("http")) {
            if (chapUrl.startsWith("/")) {
                chapUrl = "https://truyen.lohi2.com" + chapUrl;
            } else {
                chapUrl = "https://truyen.lohi2.com/" + chapUrl;
            }
        }
        
        chapters.push({
            name: name,
            url: chapUrl
        });
    });
    
    if (chapters.length === 0) {
        return Response.error("No chapters found");
    }
    
    return Response.success(chapters);
}
