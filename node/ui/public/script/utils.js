$.ajaxSetup({
    beforeSend: (jqXHR, settings) => { settings.url = "http://localhost:3000" + settings.url },
    contentType: "application/x-www-form-urlencoded",
    headers: {
        "Authorization": "Bearer " + readCookie("token")
    },
    dataType: 'json',
});

function readCookie(name) { 
    let nameEQ = encodeURIComponent(name) + "="; 
    let ca = document.cookie.split(';'); 
    for (let i = 0; i < ca.length; i++) { 
        let c = ca[i]; 
        while (c.charAt(0) === ' ') 
            c = c.substring(1, c.length); 
        if (c.indexOf(nameEQ) === 0) 
            return decodeURIComponent(c.substring(nameEQ.length, c.length)); 
    } 
    return null; 
} 
 
function createCookie(name, value, days) { 
    let expires; 
    if (days) { 
        let date = new Date(); 
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); 
        expires = "; expires=" + date.toGMTString(); 
    } else { 
        expires = ""; 
    } 
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; SameSite=Lax; path=/"; 
} 
 
function eraseCookie(name) { 
    createCookie(name, "", -1); 
} 
 