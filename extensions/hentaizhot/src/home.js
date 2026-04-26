load("config.js");

function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL + "/browse?page={{page}}", script: "gen.js" },
        { title: "Xếp hạng", input: BASE_URL + "/ranking/hentai", script: "gen.js" },
        { title: "Thể loại", input: BASE_URL + "/genres", script: "genre.js" }
    ]);
}
