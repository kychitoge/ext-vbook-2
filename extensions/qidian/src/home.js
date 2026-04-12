function execute() {
    return Response.success([
        { title: "月票榜", input: "/majax/rank/yuepiaolist?gender=male&pageNum={page}&{_csrfToken}", script: "gen0.js" },
        {
            title: "新书榜",
            input: "/majax/rank/newbooklist?gender=male&pageNum={page}&{_csrfToken}",
            script: "gen0.js"
        },
        {
            title: "高武世界",
            input: "/majax/category/list?catId=21&subCatId=78&gender=male&pageNum={page}&{_csrfToken}",
            script: "gen0.js"
        },
    ]);
}