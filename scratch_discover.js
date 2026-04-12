
function execute(input) {
    let b = Engine.newBrowser();
    b.launchAsync(input);
    sleep(10000); // 10s wait for Next.js to load APIs
    let urls = b.urls();
    let apiUrls = [];
    urls.forEach(u => {
        if (u.indexOf("api") !== -1 || u.indexOf("graphql") !== -1 || u.indexOf("json") !== -1) {
            apiUrls.push(u);
        }
    });
    b.close();
    return Response.success(apiUrls);
}
