function execute(url) {
    var browser = Engine.newBrowser(); 
    browser.setUserAgent(UserAgent.android()); // Tùy chỉnh user agent
    var doc = browser.launch(url, 5000);
    browser.close();
    var htm = doc.select(".content_txt").html();
    return Response.success(htm);
}