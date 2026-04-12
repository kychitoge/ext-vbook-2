function get_device() {
    if (!localStorage.getItem("id2")) {
        let response = fetch("https://api.langge.cf/user");
        let doc = response.request.headers.cookie
        if ( doc == undefined) {
            return undefined
        }
        localStorage.setItem("id2", doc)
    }
    return localStorage.getItem("id2")
}