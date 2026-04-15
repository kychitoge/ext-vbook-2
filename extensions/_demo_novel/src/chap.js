function execute(url) {
    // Novel: returns raw HTML content
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);
    
    let doc = response.html();
    
    // Remove ads and unwanted elements
    doc.select(".ads, .advertisement, .banner, script, style, .comment, .fb-comments").remove();
    doc.select("#ads, #advertisement, .google-ads, .quang-cao").remove();
    
    // Get content - try multiple selectors
    let content = "";
    let contentSelectors = [
        "#content", 
        ".chapter-content", 
        ".content", 
        ".noi-dung",
        ".chuong-content",
        "#novel-content",
        "article.content"
    ];
    
    for (let i = 0; i < contentSelectors.length; i++) {
        let el = doc.select(contentSelectors[i]).first();
        if (el) {
            content = el.html() + "";
            if (content && content.length > 100) break;
        }
    }
    
    if (!content) {
        return Response.error("No content found");
    }
    
    // Clean content
    content = content.replace(/&nbsp;/g, " ");
    content = content.replace(/&lt;/g, "<");
    content = content.replace(/&gt;/g, ">");
    content = content.replace(/&amp;/g, "&");
    content = content.replace(/<script[\s\S]*?<\/script>/gi, "");
    content = content.replace(/<style[\s\S]*?<\/style>/gi, "");
    content = content.replace(/\s+/g, " ");
    content = content.trim();
    
    return Response.success(content);
}