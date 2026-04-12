load('config.js');
function execute(url) {
    let idBook = url.match(/\d+/g)[0];
    let _csrfToken = get_csrfToken();
    url = `https://wxapp.qidian.com/api/book/categoryV2?bookId=${idBook}&${_csrfToken}`;
    console.log("url: " + url);
    let response = fetch(url);
    let json = response.json()
    const data = [];
    json.data.vs.map(i => {
        i.cs.map(o => {
            data.push({
                url:"https://m.qidian.com/chapter/" + idBook + "/" + o.id + "/",
                name: o.cN,
                pay: o.sS == 1 ? false : true,
            });
        })
    })
    return Response.success(data);
}