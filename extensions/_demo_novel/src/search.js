function execute(key, page) {
    if (!page) page = "1";
    
    let response = fetch(BASE_URL + "/tim-kiem/", {
        queries: { tukhoa: key, page: page }
    });
    if (!response.ok) return Response.error("Search failed");
    
    let doc = response.html();
    const data = [];
    
    doc.select(".search-result .item, .result-list .item, .tim-kiem .row").forEach(function(el) {
        let nameEl = el.select(".title a, h3 a").first();
        let name = nameEl ? (nameEl.text() + "") : "";
        let link = nameEl ? (nameEl.attr("href") + "") : "";
        
        let coverEl = el.select("img").first();
        let cover = coverEl ? (coverEl.attr("src") + "") : "";
        
        let descEl = el.select(".description, .desc").first();
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
    
    let nextPage = data.length > 0 ? String(parseInt(page) + 1) : null;
    return Response.success(data, nextPage);
}