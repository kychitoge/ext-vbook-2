function execute(url) {
    var browser = Engine.newBrowser(); // Khởi tạo browser
    var doc = browser.launch(url, 5000);
    console.log(doc)
    let js = JSON.stringify(browser.urls())
    console.log(js)
    browser.close();
    return "";
}

