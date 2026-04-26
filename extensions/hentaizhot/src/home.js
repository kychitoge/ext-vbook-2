var BASE_URL = "https://hentaiz.hot";

// home.js — Danh sách tab trang chủ
// có link thì mới thêm vào
// Contract: execute() → [{ title, input, script }]
// Mỗi item = 1 tab. "input" là URL truyền vào gen.js, {{page}} sẽ được thay tự động
function execute() {
    return Response.success([
        {
            title: "Mới cập nhật",
            input: BASE_URL + "/browse/__data.json?sort=publishedAt_desc&page={{page}}&limit=24&animationType=TWO_D&contentRating=ALL&isTrailer=false&year=ALL&x-sveltekit-invalidated=001",
            script: "gen.js"
        }
    ]);
}
