/* UI.js */
var cxMessages = $("#cx-messages");
var cxMessagesClass = $(".cx-messages")[0];

// Scroll en alta indirmek için kullanıyoruz.
function scroolToBottom() {
    cxMessagesClass.scrollTo(0, cxMessagesClass.scrollHeight);
}

// Youtube linkini embed link olarak değiştirir
function convertYouTubeToEmbed(messageText) {
    //console.log("original response:" + messageText);

    if (!messageText) return messageText;

    // YouTube tüm URL formatlarını yakala
    const youtubeRegex = /https?:\/\/(?:www\.)?youtube\.com\/embed\/[A-Za-z0-9_-]+/g;
    // /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?[^ ]*v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;

    const match = messageText.match(youtubeRegex);

    //console.log("match text:" + match);

    // Link yoksa mesajı aynen döndür
    if (!match) return messageText;

    const videoId = match[1];
    const iframe = `
        <iframe 
            id="video"
            sandbox="allow-scripts allow-popups allow-same-origin"
            width="560" 
            height="315" 
            src="${videoId}" 
            frameborder="0"
            allowfullscreen>
        </iframe>
    `;

    /* Eğer mesaj sadece linkten ibaretse direkt iframe döndür
    if (messageText.trim() === match[0].trim()) {
        return iframe.trim();
    } */

    // Mesaj içinde link geçiyorsa linki iframe ile değiştir
    //return messageText.replace(youtubeRegex, iframe.trim());
    return iframe;
}

// Her yeni mesajda ekrana mesajı basıp, localStorage da aynı mesajı saklıyoruz.
function addNewMessage(messageType, messageText, messageTime) {
    messageText = convertYouTubeToEmbed(messageText);
    //console.log("converted message text:" + messageText);
    var newMessageHTML = '<div class="cx-message cx-message-' + messageType + '"> <div class="cx-message-icon"><div class="icon-image"></div><div class="icon-text">Glamira</div></div> <div class="cx-message-body"> <div class="cx-message-text">' + messageText + '</div> <div class="cx-message-time">' + messageTime + '</div> </div> </div>';

    cxMessages.append(newMessageHTML);
    scroolToBottom();

    // LocalStorage da chat geçmişini tutuyoruz.
    var cxChatHistory = localStorage.getItem("cxChatHistory");
    localStorage.setItem("cxChatHistory", cxChatHistory + newMessageHTML);
}

// Enter ile chat başlatabilmeyi sağlıyoruz.
$('#txtStartMessage').keypress(function (e) {
    if (e.which == 13) {
        $("#btnSubmitForm").click();
    }
});

// Enter ile mesaj gönderebilmeyi sağlıyoruz.
$('#txtMessage').keypress(function (e) {
    if (e.which == 13) {
        var textMessage = $("#txtMessage").val();
        sendMessage(textMessage);
        $("#txtMessage").val("");
        return false;
    }
    else {
        sendTyping();
    }
});

var startMessageInterval; 
// Start new chat butonuna basınca chat başlamasını sağlıyoruz.
$("#btnSubmitForm").click(function(){
    var userData = {"displayName": null, "firstName": null, "lastName": null, "email": null, "phoneNumber": null, "avatarImageUrl": null, "customFields": null};
    
    userData.displayName = $("#txtEmail").val();
    userData.firstName = $("#txtUserName").val();
    userData.email = $("#txtEmail").val();
    userData.customFields = {
        "Zendesk Email": $("#txtEmail").val()
    };

    var validation = true;

    if (userData.displayName == null || userData.displayName.length < 1) {
        validation = false;
        $("#userNameValidation").show();
    } else {
        $("#userNameValidation").hide();
    }

    if (userData.email == null || userData.email < 1) {
        validation = false;
        $("#emailValidation").show();
    } else {
        $("#emailValidation").hide();
    }

    if (validation == false) {
        return null;
    }

    // Kullanıcının formda yazdığı mesajı alıyoruz. UserDataCheck sonrası bu mesaja erişilemediği için burada alınmıştır.
    var _startMessage = $("#txtStartMessage").val();
    
    // Kullanıcı bilgileri kontrol ediliyor.
    var userDataStr = JSON.stringify(userData);
    var userDataBase64 = Base64.encode(userDataStr);
    pUserData = userDataBase64;
    UserDataCheck(_startMessage);
    
    // Kullanıcı mesajı gönderiliyor.
    /*if (_startMessage && _startMessage.length > 0) {
        startMessageInterval = setInterval(() => {
            sendMessage(_startMessage);
            clearInterval(startMessageInterval);
        }, 500);
    }*/

});

// Attach butonuna basınca dosya yükleme ve göndermeyi sağlıyoruz.
$("#btnAttach").click(function(){
    $('#fileUpload').trigger("click");
});

$("#fileUpload").change(function(){
    if (checkCookie("cxConversationId")) {     
        $('#uploading').css("color", "#989898"); 
        $('#uploading').html($.t("upload-status.uploading"));
        $('#uploading').show();

        var formData = new FormData();
        formData.append('file', $('#fileUpload')[0].files[0]); 
        
        var _conversationId = getCookie("cxConversationId");

        $.ajax({
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: { 
                "Api-Credential": "c8764636f4d848f99c6df334cf2be51b"
            },
            url: "https://glamira-cfs.wace.com.tr/api/file/upload?chatId=" + _conversationId,
            success: function(data, textStatus, request) {
                console.log("File upload message: ");
                console.log(data);

                if(data.status == "FileUplaoded") {
                    $('#uploading').css("color", "#989898");
                    $('#uploading').html($.t("upload-status.uploaded"));
                    sendMessage(data.url);
                }
                else if (data.status == "MaxFileCount") {
                    $('#uploading').css("color", "#B00024");
                    $('#uploading').html($.t("upload-status.max-file"));
                }
                else if (data.status == "MaxFileSize") {
                    $('#uploading').css("color", "#B00024");
                    $('#uploading').html($.t("upload-status.max-size"));
                }
                else if (data.status == "NoFile") {
                    $('#uploading').css("color", "#B00024");
                    $('#uploading').html($.t("upload-status.no-file"));
                }

                $('#fileUpload').val(''); 
                setTimeout(() => {
                    $('#uploading').hide();
                }, 3000);
            },
            error: function(data, textStatus, error) {
                console.log("File upload error: ");
                console.log(data);

                $('#uploading').css("color", "#B00024");
                $('#uploading').html($.t("upload-status.error"));

                $('#fileUpload').val(''); 
                setTimeout(() => {
                    $('#uploading').hide();
                }, 3000);
            }
        });
    }
});

// Gönder butonuna basınca mesaj göndermeyi sağlıyoruz.
$("#btnSendMessage").click(function(){
    var textMessage = $("#txtMessage").val();
    sendMessage(textMessage);
    $("#txtMessage").val("");
});

// Sohbeti küçült butonuna tıklayınca widget küçültmeyi sağlıyoruz.
$("#btnChatMinimize").click(function(){
    //window.parent.widgetClose();
    window.parent.postMessage("widgetClose", pBaseUrl);
});

// Sohbeti sonlandır butonuna tıklayınca modal çıkarıyoruz.
$("#btnChatExit").click(function(){
    // Sohbet ekranında değilse modal çıkarmadan direk sonlandırıyoruz.
    var cxMessageArea = document.getElementById("cx-message-area");
    if(!cxMessageArea || cxMessageArea.style.display == 'none') {
        uiWidgetRemove();
    }
    else {
        $(".cx-modals").removeClass("cx-hidden");
        $(".cx-modal-exit").removeClass("cx-hidden");
    }
});

// Sohbeti sonlandırma modalında sonlandır seçeneği seçildiğinde işlem yapıyoruz. 
$("#btnChatExitYes").click(function(){
    if(checkCookie("cxSurveyChatId")) {
        uiWidgetRemove();
    }
    else {
        $("#btnChatExitNo").click();
        uiRedirectToSurvey();
        exitCurrentChat(); // Burası uiRedirect den aşağıda olmazsa chatId alınamaz!
    }
});

// Sohbeti sonlandır modalında vazgeç seçildiğinde modalı kapatıyoruz.
$("#btnChatExitNo").click(function(){
    $(".cx-modals").addClass("cx-hidden");
    $(".cx-modal-exit").addClass("cx-hidden");
});

function uiRedirectToSurvey(){   
    var _conversationId = getCookie("cxConversationId");
    setCookie("cxSurveyChatId", _conversationId, 5); 
    $("#cx-message-area").remove();
    $("#surveyForm").show();
}

function uiWidgetRemove(){
    clearCookies();
    deleteCookie("cxSurveyChatId");
    setTimeout(() => {
        window.parent.postMessage("widgetRemove", pBaseUrl);
    }, 300);
}

// Privacy policy hide 
function PrivacyPolicyHide() {
    var _privacyPolicyElem = $(".cx-privacy-policy");
    _privacyPolicyElem.hide();
}

// User data check
function UserDataCheck(message) {  
    if (checkCookie("cxEventStreamUri") || 
        (pUserData != null && pUserData.length > 0)) {
        $("#userForm").remove();   
        $("#cx-message-area").show();   
        setTimeout(() => {
            sendMessage(message);

            // Privacy policy hide after 60 seconds 
            setTimeout(() => {
                PrivacyPolicyHide();
            }, 60000);
        }, 500);     
    }  
    else if (checkCookie("cxSurveyChatId")) {
        $("#userForm").remove();   
        $("#cx-message-area").remove();  
        $("#surveyForm").show();
    }
    else {
        $("#userForm").show();
        $("#cx-message-area").hide();
    }
}

// Anket cevabını gönderiyoruz ve feedback alanımızı gösteriyoruz.
$("#btnSendForm").click(function(){
    var _rate = $('input[name="chkRate"]:checked').val();
    var _message = $("#txtSurveyMessage").val();

    if (checkCookie("cxSurveyChatId")) {        
        var _chatId = getCookie("cxSurveyChatId");

        var answers = {
            "chatId": _chatId,
            "rate": _rate,
            "comment": _message
        };

        $.ajax({
            type: "POST",
            headers: { 
                'Content-Type': 'application/json',
                "Api-Credential": "c8764636f4d848f99c6df334cf2be51b"
            },
            data: JSON.stringify(answers),
            url: "/survey/api/survey/send",
            success: function(data, textStatus, request) {
                console.log("Survey send message: ");
                console.log(data);

                if(data.status == "Sended") {
                    console.log("Sended survey answers");
                }
                else {
                    console.log("Error: An error occurred while saving the survey");
                }
                
                $("#surveyForm").remove();
                $("#surveyFeedback").show();
            },
            error: function(data, textStatus, error) {
                console.log("Seurvey send error: ");
                console.log(data);

                $("#surveyForm").remove();
                $("#surveyFeedback").show();
            }
        });
    }
    else {
        console.log("Error: Not found conversation id!");
    }
});

// Anket geri bildirimi alanını kapatıyoruz.
$("#btnSurveyFeedbackClose").click(function(){
    uiWidgetRemove();
});

// Sayfa yüklenince dil set ediliyor ve kullanıcı bilgisi kontrol ediliyor.
$(function () {
    // Localization 
    i18next
    .use(i18nextXHRBackend)
    .init({
        debug: false,
        lng: pLanguage,
        backend: {
        loadPath: './locales/{{lng}}/{{ns}}.json'
        }       
    }, function(err, t) {
        i18nextJquery.init(i18next, $);
        $('body').localize();

        $('.lang-select').click(function() {
        i18next.changeLanguage(this.innerHTML);
        $('body').localize();
        });
    });

    // User data check
    UserDataCheck();
});
