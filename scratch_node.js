const fs = require('fs');
const html = fs.readFileSync('scratch_valvrare_list.html', 'utf-8');

// Find truyen/xxx or novel/xxx patterns
const links = html.match(/(?:href|link|url|slug)[\s"':\\]+([\w-]{5,})/gi);
if (links) {
    const unique = [...new Set(links)];
    console.log("Found links or slugs:");
    console.log(unique.slice(0, 50));
}

// Find api paths
const apis = html.match(/api\/[\w/-]+/gi);
if (apis) {
    console.log("\nFound API paths:");
    console.log([...new Set(apis)]);
}

// Look for __NEXT_DATA__
const nextMatch = html.match(/__NEXT_DATA__\s*=\s*(\{.*?\});/);
if (nextMatch) {
    console.log("Found __NEXT_DATA__");
}
