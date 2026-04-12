load("config.js");
function execute(url, page) {
    if (!page) page = '1';
    let res = fetch(url)
    let cookie = res.request.headers.cookie
    var accessToken = cookie.match(/accessToken(.*?);/g)[0].replace(";", "").replace("accessToken=", "")
    let authorization = "Bearer " + accessToken;
    let response = fetch("https://backend.metruyencv.com/api/bookmarks?filter%5Bgender%5D=1&limit=15&page=" + page, {
        "headers": {
            "authorization": authorization,
        }
    });
    if (response.ok) {
        let json = response.json();
        let novelList = [];
        let next = json.pagination.next + "";
        json.data.forEach(e => {
            novelList.push({
                name: e.book.name,
                link: e.book.link,
                cover: e.book.poster['default'],
                host: BASE_URL
            })
        });
        return Response.success(novelList, next);
    }
    return Response.error("Đăng nhập MTC để xem truyện đã bookmark");
}