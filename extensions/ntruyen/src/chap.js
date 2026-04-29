function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        var doc = response.html();
        // 1. Try common selectors first
        let data = doc.select("#read-content, #chapter-content, .chapter-content, article");
        if (data && data.html() && data.html().length > 500) {
            data.select(".slide").remove();
            return Response.success(cleanHtml(data.html()));
        }

        // 2. Try extracting from Next.js data (__next_f)
        let nextData = extractNextContent(doc);
        if (nextData && nextData.length > 200) {
            return Response.success(cleanHtml(nextData));
        }
    }
    return Response.error("Vào trang nguồn kiểm tra click link shoppee rồi reload lại chương (có thể bị chặn hoặc redirect)");
}

function extractNextContent(doc) {
    let scripts = doc.select("script");
    let fullContent = "";

    // Pattern for Next.js App Router streaming data
    let regex = /self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g;

    scripts.forEach(e => {
        let script = e.html();
        if (!script || script.indexOf("__next_f") === -1) return;

        let match;
        while ((match = regex.exec(script)) !== null) {
            let raw = match[1];
            let decoded = "";
            try {
                // Decode JSON-escaped string
                decoded = JSON.parse('"' + raw + '"');
            } catch (err) {
                continue;
            }

            // Look for chapter content markers
            if (decoded.indexOf("<br>") !== -1 || decoded.indexOf("\\u003cbr\\u003e") !== -1) {
                // Strip Next.js ID prefix (e.g. "29:") and wrapping quotes
                let content = decoded.replace(/^(?:\w+:)?\"/, "").replace(/\"$/, "");
                
                if (content.length > fullContent.length) {
                    fullContent = content;
                }
            }
        }
    });

    return fullContent;
}

function cleanHtml(htm) {
    return htm
        .replace(/\\u003cbr\\u003e/g, '<br>')
        .replace(/\\u003cp/g, '<p')
        .replace(/\\u003c\/p/g, '</p')
        .replace(/\\"/g, '"') // Unescape quotes
        .replace(/·/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/p>/gi, '<br>')
        .replace(/<br\s*\/?>\s*/gi, '<br>')
        .replace(/(?:<br\s*\/?>){2,}/gi, '<br><br>') // Keep max 2 BRs
        .trim();
}
