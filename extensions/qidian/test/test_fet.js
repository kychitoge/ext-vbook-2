const CryptoJS = require('crypto-js');

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

// Hàm lấy chi tiết sách bằng fetch
async function getBookDetail(bookId) {
  const time = Date.now();
  const qdInfoStr = `0|7.9.242|1080|2206|1000014|12|1|Mi 12|792|1000014|4|0|${time}|0|0|||||1`;
  const QDInfo = qie(qdInfoStr);
  
  const query = `bookid=${bookId}&isoutbook=0`;
  const sign = CryptoJS.MD5(query).toString();
  console.log(`Sign: ${sign}`);
  const qdSignStr = `Rv1rPTnczce|${time}|0||1|7.9.242|0|${sign}|f189adc92b816b3e9da29ea304d4a7e4`;
  console.log(`QDSignStr: ${qdSignStr}`);
  const QDSign = qse(qdSignStr);
  console.log(`QDSign: ${QDSign}`);
  const headers = {
    'User-Agent': 'Mozilla/mobile QDReaderAndroid/7.9.242/792/1000014',
    'Accept': 'application/json, text/plain, */*',
    'QDInfo': QDInfo,
    'QDSign': QDSign,
    'tstamp': time.toString(),
  };

  const url = `https://druidv6.if.qidian.com/argus/api/v3/bookdetail/get?bookId=${bookId}&isOutBook=0`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: headers,
      // credentials: 'include' // Bật nếu cần gửi cookie (browser only)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Fetch failed with ${res.status}:`, errorText);
      return;
    }

    const json = await res.json();
    const data = json.Data;

    const baseBookInfo = data.BaseBookInfo;
    const authorInfo = data.AuthorInfo;

    let description = `\nTrạng thái: ${baseBookInfo.BookStatus} (连载 - Ongoing)`;
    description += `\nSố từ: ${baseBookInfo.WordsCnt}\n`;
    description += `\nCập nhật: ${timestampToTime(
      baseBookInfo.ChapterInfo.LastVipChapterUpdateTime || baseBookInfo.ChapterInfo.LastChapterUpdateTime
    )}`;
    description += `\nChương cuối: ${baseBookInfo.ChapterInfo.LastVipUpdateChapterName || baseBookInfo.ChapterInfo.LastUpdateChapterName
      }\n`;
    description += baseBookInfo.Description;

    const cover = `https://bookcover.yuewen.com/qdbimg/349573/${baseBookInfo.BookId}/150`;

    let authorBooks = authorInfo.AuthorBookList.map(book => ({
      name: book.BookName,
      url: `https://m.qidian.com/book/${book.BookId}`,
      cover: `https://bookcover.yuewen.com/qdbimg/349573/${book.BookId}/150`
    }));

    let sameRecommendBooks = data.SameRecommend.map(book => ({
      name: book.BookName,
      url: `https://m.qidian.com/book/${book.BookId}`,
      cover: `https://bookcover.yuewen.com/qdbimg/349573/${book.BookId}/150`
    }));

    let bookFriendsRecommendBooks = data.BookFriendsRecommend.map(book => ({
      name: book.BookName,
      url: `https://m.qidian.com/book/${book.BookId}`,
      cover: `https://bookcover.yuewen.com/qdbimg/349573/${book.BookId}/150`
    }));

    console.log({
      name: baseBookInfo.BookName,
      cover: cover,
      author: authorInfo.Author,
      description: description,
      host: "https://m.qidian.com",
    });

  } catch (err) {
    console.error('Request error:', err.message || err);
  }
}

// Chuyển timestamp thành chuỗi thời gian
function timestampToTime(timestamp) {
  const date = new Date(String(timestamp).length === 13 ? timestamp : timestamp * 1000);
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

// 👉 Gọi thử
getBookDetail('1043182343');
