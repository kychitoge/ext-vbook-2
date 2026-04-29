load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    var response = fetchPage(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);

    var doc = response.html();
    
    // Use schema.org selectors from B's original
    var name = doc.select("header[itemtype='https://schema.org/Book'] h1[itemprop='name']").text();
    if (!name) name = doc.select('h1').text().trim();
    if (!name) name = doc.select('meta[property="og:title"]').attr('content');

    var cover = doc.select("header[itemtype='https://schema.org/Book'] img.object-cover.rounded-xl").attr('src');
    if (!cover) cover = doc.select('meta[property="og:image"]').attr('content');
    if (!cover) cover = doc.select('img[alt]').first().attr('src');

    var authorEl = doc.select('a[href*="/tac-gia/"]').first();
    var author = authorEl ? authorEl.text().trim() : '';
    var authorUrl = authorEl ? authorEl.attr('href') : '';
    if (!author) author = doc.select("header[itemtype='https://schema.org/Book'] [itemprop='author'] [itemprop='name']").text();
    if (!author) author = doc.select('meta[name="author"]').attr('content');
    if (!author) author = doc.select('[itemprop="author"]').text().trim();
    if (!author) author = 'Đang cập nhật';

    // Extract status text from page
    var statusText = '';
    var chapterCount = '';
    
    doc.select('p, li, span').forEach(function(el) {
        var text = el.text().trim();
        if (!text) return;
        if (text.indexOf('Trạng thái:') === 0 && !statusText) {
            statusText = text.substring('Trạng thái:'.length).trim();
        } else if (text.indexOf('Số chương:') === 0 && !chapterCount) {
            chapterCount = text.substring('Số chương:'.length).trim();
        }
    });
    
    if (!statusText) statusText = 'Đang ra';
    statusText = normalizeStatus(statusText);

    // Check ongoing status
    var lowerStatus = statusText.toLowerCase();
    var ongoing = lowerStatus.indexOf('hoàn thành') === -1 &&
                  lowerStatus.indexOf('đã hoàn') === -1 &&
                  lowerStatus.indexOf('full') === -1 &&
                  lowerStatus.indexOf('complete') === -1;

    // Build detail info
    var detailParts = [];
    detailParts.push('<p><strong>Tác giả:</strong> ' + author + '</p>');
    detailParts.push('<p><strong>Trạng thái:</strong> ' + statusText + '</p>');
    if (chapterCount) detailParts.push('<p><strong>Số chương:</strong> ' + chapterCount + '</p>');

    // Genres
    var genres = [];
    var firstGenreUrl = '';
    doc.select("header[itemtype='https://schema.org/Book'] a[itemprop='genre']").forEach(function(e) {
        var title = e.text();
        var href = e.attr('href') || '';
        genres.push({
            title: title,
            input: href,
            script: 'gen.js'
        });
        if (href && !firstGenreUrl) {
            firstGenreUrl = href;
        }
    });

    // Suggests
    var suggests = [];
    if (authorUrl) {
        suggests.push({
            title: 'Truyện cùng tác giả',
            input: authorUrl,
            script: 'gen.js'
        });
    }
    if (firstGenreUrl) {
        suggests.push({
            title: 'Truyện cùng thể loại',
            input: firstGenreUrl,
            script: 'gen.js'
        });
    }

    var description = doc.select("article[itemprop='description'] [itemprop='description']").html();
    if (!description) description = doc.select('.p-3 .inline-block  p').html();

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: description,
        detail: detailParts.join('<br>'),
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}

function normalizeStatus(text) {
    if (!text) return '';
    var lower = String(text).toLowerCase();
    if (lower.indexOf('hoàn thành') >= 0 || lower.indexOf('đã hoàn') >= 0 || lower.indexOf('full') >= 0 || lower.indexOf('complete') >= 0) return 'Hoàn thành';
    if (lower.indexOf('đang ra') >= 0 || lower.indexOf('đang tiến hành') >= 0) return 'Đang ra';
    return String(text).trim();
}
