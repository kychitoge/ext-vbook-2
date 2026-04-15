function execute(url) {
    // Comic TOC: often has volumes/tap structure, or flat list
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);
    
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);
    
    let doc = response.html();
    const chapters = [];
    
    // Pattern 1: Flat list (no volumes)
    doc.select(".chapter-list a, .danh-sach-chuong a, #list-chapter a").forEach(function(el) {
        let name = el.text() + "";
        let chapterUrl = el.attr("href") + "";
        
        if (name && chapterUrl) {
            if (!chapterUrl.startsWith("http")) {
                chapterUrl = chapterUrl.startsWith("/") ? BASE_URL + chapterUrl : BASE_URL + "/" + chapterUrl;
            }
            chapters.push({ name: name, url: chapterUrl, host: BASE_URL });
        }
    });
    
    // Pattern 2: With volumes (tap) - flatten all chapters
    if (chapters.length === 0) {
        doc.select(".volume, .tap").forEach(function(volEl) {
            let volTitle = volEl.select(".vol-title, .tap-title").text() + "";
            volTitle = volTitle || "Volume";
            
            volEl.select("a, .chapter-item a").forEach(function(el) {
                let name = volTitle + " - " + (el.text() + "");
                let chapterUrl = el.attr("href") + "";
                
                if (name && chapterUrl) {
                    if (!chapterUrl.startsWith("http")) {
                        chapterUrl = chapterUrl.startsWith("/") ? BASE_URL + chapterUrl : BASE_URL + "/" + chapterUrl;
                    }
                    chapters.push({ name: name, url: chapterUrl, host: BASE_URL });
                }
            });
        });
    }
    
    if (chapters.length === 0) {
        return Response.error("No chapters found");
    }
    
    return Response.success(chapters);
}