/* Cookie JS */
function setCookie(cname, cvalue, minutes) {
    //console.log("Cookie("+cname+") set: "+cvalue+ " >>> Date: " +Date());
    /*const d = new Date();
    d.setTime(d.getTime() + (minutes * 60 * 1000));
    let expires = ";expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + expires + ";path=/;SameSite=None;Secure";*/
    localStorage.setItem(cname, cvalue);
}

function getCookie(cname) {
    //console.log("Cookie("+cname+") get >>> Date: " +Date());
    /*let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";*/
    return localStorage.getItem(cname);
}

function checkCookie(cname) {
    //console.log("Cookie("+cname+") check >>> Date: " +Date());
    /*let _cname = getCookie(cname);
    if (_cname != "" && _cname != null) {
        return true;
    } else {
        return false;
    }*/
    if(localStorage.getItem(cname) && localStorage.getItem.length > 0) {
        return true;
    } else {
        return false;
    }
}

function deleteCookie(cname) {
    //console.log("Cookie("+cname+") delete >>> Date: " +Date());
    /*const d = new Date();
    d.setTime(d.getTime() - (1 * 1000));
    let expires = ";expires="+d.toUTCString();
    document.cookie = cname + "=" + expires + ";path=/;SameSite=None;Secure";*/
    localStorage.removeItem(cname);
}