load('config.js');

function execute(key, page) {
    if (!page) page = '1';
    var url = BASE_URL + '/';
    var response = fetch(url, {
        queries: {
            s: key,
            paged: page
        }
    });

    if (response.ok) {
        var doc = response.html();
        var books = [];
        doc.select('article, .manga-item').forEach(function(el) {
            var nameEl = el.select('h2.entry-title a, h3.nt-title a, a').first();
            var coverEl = el.select('img').first();
            if (nameEl) {
                books.push({
                    name: nameEl.text().trim(),
                    link: nameEl.attr('href'),
                    cover: coverEl ? (coverEl.attr('data-src') || coverEl.attr('src')) : '',
                    description: el.select('.entry-summary, .nt-desc-short').text().trim(),
                    host: BASE_URL
                });
            }
        });

        var next = doc.select('.page-numbers.next').size() > 0;
        return Response.success(books, next ? String(parseInt(page) + 1) : null);
    }
    return Response.error('Search failed');
}
