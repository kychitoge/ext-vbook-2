load('config.js');

function execute(url, page) {
    if (!page) page = '1';
    var fetchUrl = url;
    if (page !== '1') {
        fetchUrl = url.replace(/\/$/, '') + '/page/' + page + '/';
    }

    var response = fetch(fetchUrl);
    if (response.ok) {
        var doc = response.html();
        var books = [];
        doc.select('article, .manga-item').forEach(function(el) {
            var nameEl = el.select('h2.entry-title a, h3.nt-title a, a[href*="/truyen/"]').first();
            var coverEl = el.select('img').first();
            if (nameEl) {
                var link = nameEl.attr('href');
                if (link && link.indexOf(BASE_URL + '/truyen/') > -1) {
                    books.push({
                        name: nameEl.text().trim(),
                        link: link,
                        cover: coverEl ? (coverEl.attr('data-src') || coverEl.attr('src')) : '',
                        description: el.select('.entry-summary, .nt-desc-short').text().trim(),
                        host: BASE_URL
                    });
                }
            }
        });

        // Deduplicate
        var uniqueBooks = [];
        var seenUrls = {};
        for (var i = 0; i < books.length; i++) {
            var b = books[i];
            if (!seenUrls[b.link]) {
                seenUrls[b.link] = true;
                uniqueBooks.push(b);
            }
        }

        var next = doc.select('.page-numbers.next').size() > 0;
        return Response.success(uniqueBooks, next ? String(parseInt(page) + 1) : null);
    }
    return Response.error('Failed to load book list');
}
