load('config.js');

function execute(input, page) {
    if (!page) page = "1";
    let url = BASE_URL.replace("https://", "https://backend.") + "/api/reviews?filter%5Bbook_id%5D=" + input + "&filter%5Bstatus%5D=2&include=creator%2Cbook&page=1&sort=-like_count" + "&page=" + page;

    let response = fetch(url, {
        headers: {
            "X-App": "MeTruyenChu"
        },
    });
    if (response.ok) {
        let json = response.json();
        let comments = [];
        json.data.forEach(item => {
            comments.push({
                name: item.creator.name,
                content: item.content,
            });
        });

        let nextPage = json.pagination.next;
        if (nextPage) nextPage = nextPage + "";

        return Response.success(comments, nextPage);
    }

    return null;
}