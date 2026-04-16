// chap.js — Nội dung chương truyện tranh
// Contract: execute(url) → htmlString chứa các thẻ <img> (VBook tự parse để hiển thị từng trang)
// QUAN TRỌNG: Trả về HTML string, KHÔNG phải mảng URL ảnh!
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var res = fetch(url);
    if (!res.ok) return Response.error("Cannot load: " + res.status);

    var doc = res.html();

    doc.select("script, style, ins, .ads, .advertisement").remove();

    // TODO: Selector container chứa toàn bộ ảnh của chương
    // Ví dụ: ".chapter-content", ".reading-content", "#chapter-images", ".page-chapter"
    var container = doc.select("SELECTOR_IMAGE_CONTAINER").first();
    if (!container) return Response.error("No images found");

    // Resolve lazy-load: nếu ảnh dùng data-src thay vì src → gán lại src
    container.select("img[data-src]").forEach(function(img) {
        var lazySrc = img.attr("data-src") + "";
        if (lazySrc) img.attr("src", lazySrc);
    });
    container.select("img[data-lazy-src]").forEach(function(img) {
        var lazySrc = img.attr("data-lazy-src") + "";
        if (lazySrc) img.attr("src", lazySrc);
    });

    return Response.success(container.html() + "");
}
