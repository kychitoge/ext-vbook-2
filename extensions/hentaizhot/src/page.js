function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);
    
    // page.js is a mandatory intermediary. 
    // It must return an array of URLs for toc.js to process.
    return Response.success([url]);
}
