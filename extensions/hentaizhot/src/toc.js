load("config.js");

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    // For video sites, usually there is only 1 "chapter" per detail page
    // Unless it's a series, but for hentaiz, each item in browse is an episode.
    return Response.success([
        { name: "Xem phim", url: url, host: BASE_URL }
    ]);
}
