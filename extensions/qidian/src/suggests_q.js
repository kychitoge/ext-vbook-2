function execute(input) {
    // console.log("Input received:", input);
    let doc = JSON.parse(input);  
    return Response.success(doc); 
}
