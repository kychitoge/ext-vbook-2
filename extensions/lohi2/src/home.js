// home.js — Trang chủ / Explore tabs
// Contract: execute() → [{title, input, script}]
// Each item becomes a tab. "script" is called with url=input, page=""
function execute() {
    // TODO: Customize the explore tabs for https://truyen.lohi2.com
    return Response.success([
        {
            title: "Truyện mới",
            input: "https://truyen.lohi2.com/truyen-moi",
            script: "gen.js"
        },
        {
            title: "Truyện hot",
            input: "https://truyen.lohi2.com/truyen-hot",
            script: "gen.js"
        },
        {
            title: "Hoàn thành",
            input: "https://truyen.lohi2.com/hoan-thanh",
            script: "gen.js"
        }
    ]);
}
