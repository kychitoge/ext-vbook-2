load('config.js');
function execute(key, page) {
    if (!page) page = 1;
    let _csrfToken = get_csrfToken();
    let apiUrl = `https://m.qidian.com/majax/search/list?kw=${key}&pageNum=${page}&source=NaN&${_csrfToken}`;
    let response = fetch(apiUrl);
    if (response.ok) {
        let json = response.json();
        let booklist = json.data.bookInfo.records;
        let next = parseInt(json.data.bookInfo.pageNum) + 1;
        let data = [];
        booklist.forEach(function(e) {
            data.push({
                name: e.bName,
                cover: `https://bookcover.yuewen.com/qdbimg/349573/${e.bid}/150`,
                link: `https://m.qidian.com/book/${e.bid}`,
                description: e.cnt,
            })
        })
        return Response.success(data,next);
    }
    return null;
}