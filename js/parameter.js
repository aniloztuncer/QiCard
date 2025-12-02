/* Parameter JS */
/* ?name=Rıfat&webView=false&membercode=01644843440658 */
function getParameter(name) {
    //console.log(event.data);
    //name = event.data.name
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results == null)
        return "";
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Language parameter

var pLanguage = getParameter('lang');

if(!pLanguage || pLanguage.length < 1) { 
    pLanguage = "en";
}

// Queue parameter

var pQueue = getParameter('queue');

if(!pQueue || pQueue.length < 1) { 
    pQueue = "Cx_Test"; // Main_Glamira
}

// Other parameter

var pUserData = getParameter('userdata');
var pBaseUrl = getParameter('baseurl');
/*
var pDisplayName = getParameter('displayname');
var pFirstName = getParameter('firstname');
var pLastName = getParameter('lastname');
var pEmail = getParameter('email');
var pPhone = getParameter('phone');
var pAvatarImageUrl = getParameter('avatarimageurl');
var pCustomFields = getParameter('customfields');
*/