load('config.js');

function execute(input, page) {
    if (!page) page = "1";
    let url = BASE_URL.replace("https://", "https://backend.") + "/api/comments?filter%5Bobject_id%5D=" + input + "&filter%5Bobject_type%5D=Book&include=commentable%2Ccreator%2Cparent&sort=-sticky%2C-id" + "&page=" + page;

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
                description: item.relate.name
            });
        });

        let nextPage = json.pagination.next;
        if (nextPage) nextPage = nextPage + "";

        return Response.success(comments, nextPage);
    }

    return null;
}