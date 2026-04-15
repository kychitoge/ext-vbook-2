function execute(url) {
    // Comic: returns list of image URLs, not HTML text
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);
    
    let doc = response.html();
    
    // Comic pages are usually <img> tags
    const images = [];
    
    // Pattern 1: Direct img tags
    doc.select(".page-image img, .chapter-content img, . Comic images img").forEach(function(el) {
        let src = el.attr("src") + "";
        let dataSrc = el.attr("data-src") + "";
        if (src || dataSrc) {
            images.push((dataSrc || src) + "");
        }
    });
    
    // Pattern 2: Lazy loading with data-src
    if (images.length === 0) {
        doc.select("img[data-src]").forEach(function(el) {
            let dataSrc = el.attr("data-src") + "";
            if (dataSrc) images.push(dataSrc);
        });
    }
    
    // Pattern 3: Background images in style
    if (images.length === 0) {
        doc.select("[style*='background']").forEach(function(el) {
            let style = el.attr("style") + "";
            let match = style.match(/url\(['"]?)([^'")]+)\1/);
            if (match && match[2]) {
                images.push(match[2]);
            }
        });
    }
    
    if (images.length === 0) {
        return Response.error("No images found");
    }
    
    // Normalize image URLs
    for (let i = 0; i < images.length; i++) {
        if (images[i].startsWith("//")) {
            images[i] = "https:" + images[i];
        }
    }
    
    // Comic chap returns: [{url: "...", width: ..., height: ...}] or HTML with <img>
    // Using HTML format for VBook compatibility
    let html = "";
    for (let i = 0; i < images.length; i++) {
        html += '<img src="' + images[i] + '"><br>';
    }
    
    return Response.success(html);
}