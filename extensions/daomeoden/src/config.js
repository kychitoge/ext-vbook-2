let BASE_URL = "https://daomeoden.net";
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}
function capitalizeWords(sentence) {
    const words = sentence.split(" ");
    let result = "";
    for (let i = 0; i < words.length; i++) {
        if (i > 0) result += " ";
        result += words[i][0].toUpperCase() + words[i].substring(1);
    }
    return result;
}