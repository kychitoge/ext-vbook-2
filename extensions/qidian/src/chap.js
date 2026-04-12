load('config.js');
function execute(url) {
    var response = fetch(url, {
        headers: {
            'user-agent': UserAgent.android(), // set chế độ điện thoại
        }
    });
    let doc = response.html()
    let text = doc.select("#vite-plugin-ssr_pageContext").html().replace(/\<\/?script(.*?)\"?\>/g, "");
    let json = JSON.parse(text);
    let content = json.pageContext.pageProps.pageData.chapterInfo.content;
    content = content.replace(/<br\s*\/?>|\n|<p>/g, "<br><br>");
    if (au == 123) {
        let author_say = json.pageContext.pageProps.pageData.chapterInfo.authorSay;
        if (author_say) {
            content = content + "<br><br>PS:<br><br>" + author_say;
        }
    }

    return Response.success(content)
}