$.ajaxSetup({
    beforeSend: (jqXHR, settings) => { settings.url = "http://192.168.3.30:3000" + settings.url },
    contentType: "application/x-www-form-urlencoded",
    // headers: {
    //     "Authorization": "Bearer " + readCookie("token")
    // },
    dataType: 'json',
});