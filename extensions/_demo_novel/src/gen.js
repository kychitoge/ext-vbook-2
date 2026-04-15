function execute(url, page) {
    if (!page) page = "1";
    if (url.slice(-1) !== "/") url = url + "/";
    url = url.replace("m.", "www.");
    
    let pageUrl = url + "trang/{{page}}".replace("{{page}}", page);
    let response = fetch(pageUrl);
    if (!response.ok) return Response.error("Cannot load: " + response.status);
    
    let doc = response.html();
    const data = [];
    
    doc.select(".book-list .item, .list-truyen .row, .truyen-list .item").forEach(function(el) {
        let nameEl = el.select(".title a, h3 a, .ten-truyen a").first();
        let name = nameEl ? (nameEl.text() + "") : "";
        let link = nameEl ? (nameEl.attr("href") + "") : "";
        
        let coverEl = el.select("img").first();
        let cover = coverEl ? (coverEl.attr("src") + "") : "";
        
        let descEl = el.select(".description, .desc, .gioi-thieu").first();
        let description = descEl ? (descEl.text() + "") : "";
        
        if (name && link) {
            if (cover.startsWith("//")) cover = "https:" + cover;
            if (!link.startsWith("http")) link = BASE_URL + link;
            
            data.push({
                name: name,
                link: link,
                cover: cover,
                description: description,
                host: BASE_URL
            });
        }
    });
    
    let nextPage = null;
    let nextLink = doc.select("a.next, .pagination a:last-child").attr("href");
    if (nextLink || data.length > 0) {
        nextPage = String(parseInt(page) + 1);
    }
    
    return Response.success(data, nextPage);
}