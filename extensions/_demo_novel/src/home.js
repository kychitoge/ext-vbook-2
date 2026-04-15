function execute() {
    // Novel: typically has multiple tabs (newest, hot, completed, genre list)
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL + "/danh-sach/trang/{{page}}", script: "gen.js" },
        { title: "Hot", input: BASE_URL + "/truyen-hot/trang/{{page}}", script: "gen.js" },
        { title: "Hoàn thành", input: BASE_URL + "/hoan-thanh/trang/{{page}}", script: "gen.js" },
        { title: "Thể loại", input: BASE_URL + "/the-loai", script: "genre.js" }
    ]);
}