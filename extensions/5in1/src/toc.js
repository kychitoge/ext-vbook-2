load('libs.js');
function execute(url) {
    var data;
    if (url.includes("sangtac") || url.includes("14.225.254.182")) {
        url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, STVHOST)
        if (url.slice(-1) !== "/") url = url + "/";
        let id = url.replace(/https.*?\/1\//g, "").replace(/http.*?\/1\//g, "").replace("/", "")
        console.log(id)
        if (url.includes("qidian")) {
            load('1qidian.js');
            data = getTocQidian(id)
        } else if (url.includes("69shu")) {
            load('169shu.js');
            data = getToc69shu(id)
        } else if (url.includes("ptwxz")) {
            load('1ptwxz.js');
            data = getTocPtwxz(id)
        } else if (url.includes("qimao")) {
            load('1qimao.js');
            load('crypto.js');
            data = getTocQimao(id)
        } else if (url.includes("fanqie")) {
            data = getToFA(id, url)
        }
    } else {
        if (url.includes("qidian")) {
            url = "/truyen/qidian/1/" + url.match(/\d+/g)[0] + "/";
            load('1qidian.js');
            data = getTocQidian(url)
        } else if (url.includes("piaotia")) {
            load('1ptwxz.js');
            data = getTocPtwxz1(url);
        } else if (url.includes("69shu")) {
            load('169shu.js');
            let regex = /\/(\d+)\.(html|htm)/;
            let match = url.match(regex);
            let id69 = match[1];
            data = getToc69shu(id69);
        }
    }
    return Response.success(data)
}


function getToFA(bookId, url) {
    let list = [];
    let newurl = `https://fanqienovel.com/api/reader/directory/detail?bookId=${bookId}`
    let response = fetch(newurl)
    if (response.ok) {
        let doc = response.json()
        let el = doc.data.chapterListWithVolume
        el.forEach((q) => {
            q.forEach((e) => {
                list.push({
                    name: e.title,
                    url: url + e.itemId + "/"
                })
            })
        })
    }

    return list;

}
