load("libs.js");
load("config.js");
function execute(url) {
  if (url.includes("m.qidian")) {
    load("1qidian.js");
    return Response.success(getChapQidian(url));
  }
  if (url.includes("sangtac") != 1 || url.includes("14.225.254.182") != 1) {
    if (url.includes("69shu")) {
      load("169shu.js");
      return Response.success(getChap69shu(url));
    } else if (url.includes("piaotia")) {
      load("1ptwxz.js");
      return Response.success(getChapPtwxz(url));
    } else if (url.includes("yuedu")) {
      load("269shu.js");
      return Response.success(getChap69yuedu(url));
    } else if (url.includes("api-bc.wtzw")) {
      load("1qimao.js");
      return Response.success(getChapQimao(url));
    }
  }
  if (url.includes("fanqie")) {
    load("crypto.js");
    load("1fanqie.js");
    let contentxyz = getChapFanqie(url);
    if (contentxyz == "404") {
      return Response.error(
        "Vào browser của app trang 'https://api.langge.cf/login' tạo tài khoản rồi đăng nhập.\n LƯU Ý: không download được truyện, muốn download thì vào 'https://api.doubi.tk/coffee' donate để được download"
      );
    }
    return Response.success(contentxyz);
  }
}
