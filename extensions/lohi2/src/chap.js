// chap.js — Chapter content
// Contract: execute(url) → htmlString
// IMPORTANT: Returns a plain HTML string, NOT an object!
function execute(url) {
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load chapter");
    
    let doc = response.html();
    
    // Remove ads and unwanted elements
    doc.select("script, style, .ads, .advertisement, .banner, .comment-section, noscript").remove();
    
    // Content container on https://truyen.lohi2.com
    let content = doc.select("article").html();
    
    if (!content) {
        return Response.error("Chapter content not found");
    }
    
    // Clean content
    content = content.replace(/&nbsp;/g, " ");
    
    return Response.success(content);
}
