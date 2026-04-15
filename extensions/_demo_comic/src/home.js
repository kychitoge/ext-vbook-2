function execute() {
    // Comic: similar structure, but often display cover-first
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL + "/danh-sach/trang/{{page}}", script: "gen.js" },
        { title: "Truyện mới", input: BASE_URL + "/truyen-moi/trang/{{page}}", script: "gen.js" },
        { title: "Top view", input: BASE_URL + "/top-view/trang/{{page}}", script: "gen.js" },
        { title: "Thể loại", input: BASE_URL + "/the-loai", script: "genre.js" }
    ]);
}