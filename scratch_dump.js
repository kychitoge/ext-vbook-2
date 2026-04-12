function execute(input) {
    let browser = Engine.newBrowser();
    browser.launchAsync(input);
    sleep(5000);
    // Find all links to novel details
    let html = browser.html();
    let urls = browser.urls();
    browser.close();
    
    let links = [];
    html.select("a").forEach(a => {
        links.push({ text: a.text(), href: a.attr("href") });
    });
    
    return Response.success({links: links, urls: urls});
}
