load("config.js");
load("base64.js");
load("crypto.js");

function decrypt(contentData, keys) {
    let cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(contentData)
    });
    let fixedKeyAndIvString = keys.split("").reverse().join("");

    let key = CryptoJS.enc.Utf8.parse(fixedKeyAndIvString);
    let iv = CryptoJS.enc.Utf8.parse(fixedKeyAndIvString); // Sử dụng key làm IV

    let decryptedBytes = CryptoJS.AES.decrypt(cipherParams, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return decryptedBytes.toString(CryptoJS.enc.Utf8).split("\n\n");
}


function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL)
    let response = fetch(url);

    if (response.ok) {
        let html = response.text();
        let chapterData = /window.chapterData = (.*?};)/.exec(html)[1];

        let contentData = Script.execute("let data = " + chapterData + "\n" + "function getContent() { return data.content; }", "getContent", "");

        if (contentData.length < 1000) {
            return Response.error("Vui lòng vào trang nguồn, nhấn vào dấu 3 gạch góc trên bên phải và đăng nhập MTC để đọc tiếp");
        }

        let localKeys = localStorage.getItem("keys");
        let keys = "cR7YwP1aXbZqM9Ndzz"
        if (localKeys) {
            keys = localKeys;
        }
        let decryptContent = "";
        try {
            decryptContent = decrypt(contentData, keys);
        } catch (e) {
            keys = fetch("https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/refs/heads/master/metruyenchu/src/key.txt").text();
            localStorage.setItem("keys", keys);
            decryptContent = decrypt(contentData, keys);
        }
        decryptContent.shift();
        let content = decryptContent.join("<br>");
        content = content.replace(/·/g, '');
        return Response.success(content);
    }
    return null;
}