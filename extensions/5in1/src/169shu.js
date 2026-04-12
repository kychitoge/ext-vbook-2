var host69 = 'https://69shuba.com';
function getChap69shu(url) {
    // let response = fetch(url);
    // if (response.status < 380) {
    //     var doc = response.html('gbk');
    // } else {
    // }
    var browser = Engine.newBrowser() // Khởi tạo browser
    doc = browser.launch(url, 10000)
    browser.close()
    var htm = $.Q(doc, 'div.txtnav', { remove: ['h1', 'div'] }).html();

    htm = cleanHtml(htm)
        .replace(/^ *第\d+章.*?<br>/, '')
        .replace('(本章完)', '')
        .replace(/无错版本在.*?吧首发本小说。/gmi, '')
        .replace(/本作品由六九.*?理上传~~/gmi, '')
        .replace(/<br\s*\/?>|\n/g, "<br><br>")
        ;
    return htm
}
function getToc69shu1(book_id) {
    let host = "https://sangtacviet.app";
    let res = fetch(host + "/truyen/69shu/1/" + book_id + "/");
    let cookie = res.request.headers.cookie
    cookie = cookie.match(/PHPSESSID=[^;]+/)[0];
    let cookieSTV = "access=b5a2815fbf1c87417faf5b5d62559219;"
    cookieSTV += cookie;
    let apiurl = `${host}/index.php?ngmar=chapterlist&h=69shu&bookid=${book_id}&sajax=getchapterlist`;
    let response = fetch(apiurl, {
        method: "GET",
        headers: {
            'referer': `${host}/truyen/69shu/1/${book_id}/`,
            'cookie': cookieSTV
        }
    });
    if (response.ok) {
        var json = response.json();
        console.log(JSON.stringify(json));
        var data = "";
        var chapters = [];
        data = json.oridata;
        let cacheChapter = data.split("-//-");
        let i = 0;
        let iend = cacheChapter.length;
        for (; i < iend; i++) {
            let da = cacheChapter[i].split("-/-");
            let chapterName = da[2]
            chapters.push({
                name: chapterName,
                url: host69 + "/txt/" + book_id + "/" + da[1],
            });
        }
        return chapters;
    }
}
function formatName(name) {
    var re = /^(\d+)\.第(\d+)章/;
    return name.replace(re, '第$2章');
}
function getToc69shu(id) {
    url = `${host69}/book/${id}/`
    console.log(url)
    let response = fetch(url);
    let doc = response.html('gbk');
    var data = [];
    var elems = doc.select('div.catalog > ul > li > a:not(#bookcase)');
    elems.forEach(function (e) {
        data.push({
            name: formatName(e.text()),
            url: e.attr('href'),
            host: host69
        })
    });
    return data.reverse();
}
function getDetail69shu(url) {
    let response = fetch(url);
    let doc = response.html('gbk');
    let data = {
        name: $.Q(doc, 'div.booknav2 > h1 > a').text(),
        cover: $.Q(doc, 'div.bookimg2 > img').attr('src'),
        author: $.Q(doc, 'div.booknav2 > p:nth-child(3) a').text().trim(),
        description: $.Q(doc, '#jianjie-popup > div > div.content p').html(),
        detail: $.QA(doc, 'div.booknav2 p', { m: x => x.text(), j: '<br>' })
    }
    return data;
}