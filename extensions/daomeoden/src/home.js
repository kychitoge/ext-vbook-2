function execute() {
    return Response.success([
        { title: "NGÔN TÌNH", input: "/trang-chu-ngon-tinh.html", script: "homegen.js" },
        { title: "HENTAI", input: "/trang-chu-hentai.html", script: "homegen.js" },
        { title: "BOY'S LOVE", input: "/trang-chu-boylove.html", script: "homegen.js" },
        { title: "GIRL'S LOVE", input: "/trang-chu-girllove.html", script: "homegen.js" },
        { title: "TIỂU THUYẾT", input: "/trang-chu-tieu-thuyet.html", script: "homegen.js" },
    ]);
}