function getChapFanqie(url) {
    if (url.slice(-1) !== "/") url = url + "/";
    let regex = /(\d+)\/(\d+)\/?$/;
    var chapid = url.match(regex)[2]
    let bookid = url.match(regex)[1]
    let hostF = ["https://api.langge.cf", "https://api.doubi.tk", "http://219.154.201.122:5006"]
    let keyID = get_device()
    console.log(keyID);
    if (keyID == undefined) {
        return "404";
    } else {
        for (let hostIndex = 0; hostIndex < hostF.length; hostIndex++) {
            let currentHost = hostF[hostIndex];
            // https://api.langge.cf/content?item_id=7471186000664874009_7471187218300682777&key=SAnjkf85JOjvSqPn&source=番茄&tab=小说&version=4
            // item_id = 7471187218300682777&source=番茄&tab=小说&tone_id=默认音色&version=4.6.29
            var response = fetch(`${currentHost}/content?item_id=${chapid}&source=番茄&tab=小说&tone_id=默认音色&version=4.6.29`, {
                method: "POST",
                headers: { "cookie": keyID },
            })
            if (response.ok) {
                let data = response.json();
                if (data && data.content) {
                    // let content = decrypt1(data.content);
                    let content = data.content;
                    if (content && content.trim() !== '') {
                        content = content.replace(/本书源属于大灰狼独有公益书源.*?（企鹅：\d+）/g, "")
                            .replace(/本书源属于.*?书源防失联：[^\s]+/g, "")
                            .replace(/提供免费阅读服务.*?企鹅：\d+）/g, "")
                            .replace(/发现有倒狗盗用本接口.*?谨防上当受骗/g, "")
                            .replace(/书源防失联：https:\/\/[^\s]+.*?企鹅：\d+）/g, "")
                            .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "")
                            .replace(/本书[\s\S]*?（qq：.*?）\s*/g, "")
                            .replace(/<br\s*\/?>|\n/g, "<br><br>");
                        return content;
                    }
                }
            } else {
                console.log(`Host ${currentHost} trả về lỗi: ${response.status}`);
            }
        }
        return "Không thể tải nội dung từ tất cả các server. Vui lòng thử lại sau.";
    }
}
// eval(function (p, a, c, k, e, r) { e = function (c) { return (c < 62 ? '' : e(parseInt(c / 62))) + ((c = c % 62) > 35 ? String.fromCharCode(c + 29) : c.toString(36)) }; if ('0'.replace(0, e) == 0) { while (c--) r[e(c)] = k[c]; k = [function (e) { return r[e] || e }]; e = function () { return '[3-9abe-hl-oq-zA]' }; c = 1 }; while (c--) if (k[c]) p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]); return p }('function decrypt1(4){3 i=4.5-1;while(i>=0){3 c=4.l(i);m(c!==\'\\n\'&&c!==\'\\u200c\'&&c!==\'\\o\')break;i--}3 8=4.q(0,i+1);3 r=4.q(i+1);3 9=[];3 a=r.split(\'\\o\');6(3 p=0;p<a.5;p++){3 b=a[p];m(b.5!==s)continue;3 e=\'\';6(3 j=0;j<s;j++){3 t=b.l(j);e+=t===\'\\n\'?\'0\':\'1\'}9.u(v.w(parseInt(e,2)))}3 f=9.x(\'\');3 7=0;6(3 k=0;k<f.5;k++){7+=f.y(k)}7%=g;3 h=[];6(3 d=0;d<8.5;d++){3 z=8.y(d);3 A=(z-7+g)%g;h.u(v.w(A))}return h.x(\'\')}', [], 37, '|||var|encryptedStr|length|for|shift|encryptedText|keyChars|parts|part|||binary|key|65536|decrypted||||charAt|if|u200b|u200d||substring|zwPart|16|bit|push|String|fromCharCode|join|charCodeAt|code|decryptedCode'.split('|'), 0, {}))
// function getChapFanqie_forNoir(chapid) {
//     let chapterUrl = "https://fanqie.1415918.xyz" + "/content?item_id=" + chapid;
//     let response = fetch(chapterUrl, {
//         headers: {
//             Authorization: "Bearer " + "",
//         },
//     });
//     if (response.ok) {
//         let json = response.json();
//         let content = json.data.data.content
//         content = content.replace(/<header[\s\S]*?<\/header>/gi, "")
//             .replace(/<h1[\s\S]*?<\/h1>/gi, "")
//             .replace(/<br\s*\/?>|\n/g, "<br><br>");
//         return content;
//     }
//     return null;
// }