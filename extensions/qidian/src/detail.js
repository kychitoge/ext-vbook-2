load('libs.js');
load('config.js');
load('crypto.js');
function execute(url) {
    let bookId_b = url.match(/\d+/g)[0];
    const time = Date.now();
    const qdInfoStr = `0|7.9.242|1080|2206|1000014|12|1|Mi 12|792|1000014|4|0|${time}|0|0|||||1`;
    const QDInfo = qie(qdInfoStr);

    const query = `bookid=${bookId_b}&isoutbook=0`;
    const sign = CryptoJS.MD5(query).toString();
    const qdSignStr = `Rv1rPTnczce|${time}|0||1|7.9.242|0|${sign}|f189adc92b816b3e9da29ea304d4a7e4`;
    const QDSign = qse(qdSignStr);
    const url_api = `https://druidv6.if.qidian.com/argus/api/v3/bookdetail/get?bookId=${bookId_b}&isOutBook=0`;
    const headers = {
        'User-Agent': 'Mozilla/mobile QDReaderAndroid/7.9.242/792/1000014',
        'Accept': 'application/json, text/plain, */*',
        'QDInfo': QDInfo,
        'QDSign': QDSign,
        'tstamp': time.toString(),
    };
    const response = fetch(url_api, {
        method: 'GET',
        headers: headers,
    }).json();
    const data = response.Data;
    const baseBookInfo = data.BaseBookInfo;
    const authorInfo = data.AuthorInfo;

    // Cập nhật description
    let description = `<br>连载: ${baseBookInfo.BookStatus}<br>`;
    description += `<br>Số từ: ${baseBookInfo.WordsCnt}<br>`;
    // Thêm thông tin cập nhật và chương cuối vào description
    description += `<br>Cập nhật: ${timestampToTime(
        baseBookInfo.ChapterInfo.LastVipChapterUpdateTime || baseBookInfo.ChapterInfo.LastChapterUpdateTime
    )}`;
    description += `<br>Chương cuối: ${baseBookInfo.ChapterInfo.LastVipUpdateChapterName || baseBookInfo.ChapterInfo.LastUpdateChapterName
        }<br>`;
    description += `<br>作品简介:<br> ${baseBookInfo.Description.replace(/\\n/g, "<br>")}`;

    // Lấy cover
    const cover = `https://bookcover.yuewen.com/qdbimg/349573/${bookId_b}/150`;
    let authorBooks = authorInfo.AuthorBookList.map(book => ({
        name: book.BookName,
        link: `https://m.qidian.com/book/${book.BookId}`,
        cover: `https://bookcover.yuewen.com/qdbimg/349573/${book.BookId}/150`
    }));

    let sameRecommendBooks = data.SameRecommend.map(book => ({
        name: book.BookName,
        link: `https://m.qidian.com/book/${book.BookId}`,
        cover: `https://bookcover.yuewen.com/qdbimg/349573/${book.BookId}/150`
    }));

    let bookFriendsRecommendBooks = data.BookFriendsRecommend.map(book => ({
        name: book.BookName,
        link: `https://m.qidian.com/book/${book.BookId}`,
        cover: `https://bookcover.yuewen.com/qdbimg/349573/${book.BookId}/150`
    }));

    let suggests = [
        {
            title: "Truyện cùng tác giả:",
            input: JSON.stringify(authorBooks),
            script: "suggests_q.js"
        },
        {
            title: "Truyện đề cử (cùng thể loại):",
            input: JSON.stringify(sameRecommendBooks),
            script: "suggests_q.js"
        },
        {
            title: "Bạn đọc cũng đọc:",
            input: JSON.stringify(bookFriendsRecommendBooks),
            script: "suggests_q.js"
        }
    ];
    let genres = baseBookInfo.BookUgcTag.map(tag => ({
        title: tag.TagName,
        input: tag.TagName,
        script: "search.js"
    }));
    genres.unshift({
        title: baseBookInfo.SubCategoryName,
        input: baseBookInfo.SubCategoryName,
        script: "gen_detail.js"
    });

    return Response.success({
        name: baseBookInfo.BookName,
        cover: cover,
        author: authorInfo.Author,
        description: description,
        host: "https://m.qidian.com",
        genres: genres,
        suggests: suggests,
    });
}

// QDInfo mã hóa
function qie(data) {
    const key = CryptoJS.enc.Utf8.parse('0821CAAD409B84020821CAAD');
    const iv = CryptoJS.enc.Base64.parse('AAAAAAAAAAA=');
    const encrypted = CryptoJS.TripleDES.encrypt(data, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
}

// QDSign mã hóa
function qse(data) {
    const key = CryptoJS.enc.Utf8.parse('{1dYgqE)h9,R)hKqEcv4]k[h');
    const iv = CryptoJS.enc.Utf8.parse('01234567');
    const encrypted = CryptoJS.TripleDES.encrypt(data, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
}
function timestampToTime(timestamp) {
    const date = new Date(String(timestamp).length === 13 ? timestamp : timestamp * 1000);
    return date.toISOString().replace('T', ' ').slice(0, 19);
}
