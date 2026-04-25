load("config.js");
load("crypto.js"); // Load thư viện bridge crypto

function execute(url) {
    const secret = "174587236491eyoruwoiernzwueyquhszsadhajsdha8";
    const token = "";

    let storyId = null;
    if (url) {
        let match = String(url).match(/(\d+)/);
        if (match) storyId = match[1];
    }
    if (!storyId) return null;

    // Sử dụng CryptoJS.SHA256 từ bridge
    let payload = {
        id_story: storyId,
        delta: "0",
        all: "all",
        hash: CryptoJS.SHA256(token + storyId + "0all" + secret).toString()
    };

    let response = fetch(API_BASE + "/ttv/ttv_apiv2/public/get_list_chapter", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: "get_list_chapter=" + encodeURIComponent(JSON.stringify(payload))
    });

    if (!response.ok) return null;

    let data = response.json();
    let chapters = data && (data.chapter || data.chapters);
    if (!chapters || !chapters.length) return Response.success([]);

    let list = [];
    chapters.forEach(chap => {
        let name = chap.name_id_chapter || chap.name || "";
        let title = chap.content_title_of_chapter || chap.title || "";
        let label = title ? (name + " - " + title) : name;
        list.push({
            name: label,
            url: "__" + storyId + "__" + chap.id,
            host: BASE_URL
        });
    });

    return Response.success(list);
}

