/* Cammon JS */
var deployementId = "21d8b1f2-0ff4-4e4b-947b-ed49de2fd36f"; // "ea702c5a-242a-4446-adfc-1ddf9a4fc71c";
var wssUrl = "wss://webmessaging.mypurecloud.de/v1?deploymentId=" + deployementId;
var apiUrl = "https://api.mypurecloud.de";
var token = "member_00000002";  // guest_20250115011236_00000001 (Burada her müşteri için uniq bir uuid değeri olmalıdır.)
var conversationId = null;
var firstMessage = null;
var jwtToken = null;
var webSocket;

function startNewChat(_startMessage) {
    firstMessage = _startMessage;
    startConnection(wssUrl); // Wss bağlantısını yapıyoruz   
}

// _startNew default olarak false gönderilmelidir, sadece SessionResponse readOnly = true ise _startNew = true olarak gönderilmelidir
function createNewSession(_startNew = false) {
    var tokenData = {
        "action": "configureSession",
        "deploymentId": deployementId,
        "token": token,
        "startNew": _startNew
    }

    if (webSocket) {
        webSocket.send(JSON.stringify(tokenData)); // Token ile yeni bir session oluşturuyoruz
    }
}

function sendMessage(message) {
    if(!webSocket) {
        startNewChat(message);
    }
    else {
        var sendMessageData = {
            "action": "onMessage",
            "token": token,
            "message": {
              "type": "Text",
              "text": message
            }
        };

        webSocket.send(JSON.stringify(sendMessageData));
    }
}

function sendTyping() {
    if(webSocket) {
        var sendTypingMessageData = {
            "action": "onMessage",
            "message": {
              "type": "Event",
              "events": [
                {
                  "eventType": "Typing",
                  "typing": {
                    "type": "On"
                  }
                }
              ]
            },
            "token": token
        };

        webSocket.send(JSON.stringify(sendTypingMessageData));
    }
}

function exitCurrentChat() {
    var _conversationId = getCookie("cxConversationId");
    var _memberId = getCookie("cxMemberId");
    var _jwt = getCookie("cxJwt");

    if (_conversationId.length > 0 && _memberId.length > 0) {
        $.ajax({
            type: "DELETE",
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json' ,
                'Authorization': 'Bearer ' + _jwt
            },
            url: serverUrl + "/api/v2/webchat/guest/conversations/"+_conversationId+"/members/"+_memberId,
            success: function(data, textStatus, request) {
                console.log("Chat ended: ");
                console.log(data);
                
                var message = $.t("system-message.chat-ended");
                addNewMessage("system", message, timeFormatter(data?.eventBody?.timestamp));
                window.parent.postMessage("conversationEnded", pBaseUrl); // Sohbetin sonlandığı bilgisini ver.
                clearCookies();
            },
            error: function(data, textStatus, error) {
                console.log("End chat error: ");
                console.log("[Data] " + data);
            }
        });
    }
}

function startConnection(url){
    webSocket = new WebSocket(url);

    webSocket.onopen = function(event) {
        streamOnOpen(event);
    };

    webSocket.onmessage = function(event) {
        streamOnMessage(event)
    };

    webSocket.onclose = function(event) {
        streamOnClose(event)
    };

    webSocket.onerror = function(event) {
        streamOnError(event)
    };
}

// Sohbetin başaltıldığı token için bir jwt üretir, bu jwt wss içinden onMessage olarak gelir
function getJwtToken() {
    var jwtTokenMessageData = {
        "action": "getJwt",
        "token": token
      }

    if (webSocket) {
        webSocket.send(JSON.stringify(jwtTokenMessageData));
    }
}

// Sohbet için üretilen jwt kullanılarak, sohbetin hsitory si çekilebilir
function getMessageHistory() {
    if (token) {
        var historyUrl = apiUrl + "/api/v2/webmessaging/messages?pageSize=10&pageNumber=1";

        $.ajax({
            type: "GET",
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json' ,
                'Authorization': 'Bearer ' + jwtToken
            },
            url: historyUrl,
            success: function(data, textStatus, request) {
                console.log("History: ");
                console.log(data);
            },
            error: function(data, textStatus, error) {
                console.log("History error: ");
                console.log(textStatus);
                console.log(error);
                console.log(data);
            }
        });
    }
}

// Görüşmenin müşteri tarafından sonlandırılmasını sağlar. Müşteri sohbeti sonlandırdıktan sonra aynı sohbet devam etmez ve yeni bir sohbet başlatmak zorunludur.
function exitCurrentChat() {
    if(webSocket){
        var closeSessionData = {
            "action": "onMessage",
            "message": {
              "type": "Event",
              "events": [
                {
                  "eventType": "Presence",
                  "presence": {
                    "type": "Clear"
                  }
                }
              ]
            },
            "token": token
          };

        webSocket.send(JSON.stringify(closeSessionData));
    }
}

var typingTimeout;
function streamOnMessage(event){
    var data = JSON.parse(event.data);
    console.log("### MESSAGE ###");
    console.log(data);

    if (data.type == "response") {
        if (data.class == "SessionResponse" && data.body.readOnly == true) {
            createNewSession(true); // Eğer başlattığımız session daha önce müşteri tarafından kapatıldıysa readOnly olacağından yeni bir mesajlaşma başlatmak için startNew = true olarak tekrar çağırıyoruz
        }
        else if (data.class == "SessionResponse" && data.body.connected == true) {
            // Session başladığında sohbet için bir jwtToken üretiyoruz
            getJwtToken();

            //var languageName = $.t("language-name"); // Dil paketinden dilin adını alıyoruz. 

            // Parametre olarak gelen userdata verisini decode ederek json formatta veri elde ediyoruz
            var userData = JSON.parse(Base64.decode(pUserData)); 

            // Sohbet başlangıç verisini oluşturuyoruz
            var startChatData = {
                "action": "onMessage",
                "token": token,
                "message": {
                    "type": "Text",
                    "text": firstMessage,
                    "channel": {
                        "metadata": {
                            "customAttributes": {
                                "name": userData.firstName??"Guest" + " " + userData.lastName??"", // Display name
                                "memberId": token, // userData.memberId (Buraya memberId değeri gelecektir. Örnek için bu değer girilmiştir.)
                                "firstName": userData.firstName??"",
                                "lastName": userData.lastName??"",
                                "email": userData.email??"",
                                "phoneNumber": userData.phoneNumber??"",
                                "dateOfBirth": "21/01/2000", // userData.dateOfBirth
                                "mainCategory": "MainCategoryName",
                                "subCategory": "SubCategoryName",
                                "language": "TR", // TR, EN, DE...
                                "platform": "web", // web, ios, android...
                                "token": token 
                            }
                        }
                    }
                }
            }
    
            setTimeout(() => {
                webSocket.send(JSON.stringify(startChatData)); // Oluşturduğumuz session a oluşturduğumu başlangıç verisini mesaj olarak gönderip sohbeti başlatıyoruz
    
                console.log("Started New Chat");
                window.parent.postMessage("conversationStarted", pBaseUrl); // Sohbetin başlatıldığı bilgisini ver.
    
                var currentDate = new Date();
                var message = $.t("system-message.chat-started");
                addNewMessage("system", message, timeFormatter(currentDate));
            }, 500);
        }
        else if (data.class == "JwtResponse" && data.body.jwt) {
            jwtToken = data.body.jwt;
        }
    }

    if (data.type == "message") {
        if (data.body.type == "Event" && data.body.direction == "Outbound") { // Gelen event
            if (data.body.events.find(event => event.eventType == "Typing" && event.typing.type == "On")) { // Agent yazıyor 
                $("#typing").show(); // Typing mesajı geldiğinde yazıyor metnini göster.

                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    $("#typing").hide(); // Metni 5sn sonra otomatik olarak gizle.
                }, 5000);
            }
            else if (data.body.events.find(event => event.eventType == "Presence" && event.presence.type == "Disconnect")) { // Görüşme sonlandırıldı
                var message = $.t("system-message.agent-disconnected");
                addNewMessage("system", message, timeFormatter(data.body.channel.time));
                
                window.parent.postMessage("conversationEnded", pBaseUrl); // Sohbetin sonlandığı bilgisini ver.
                uiRedirectToSurvey();
                clearCookies();
            }
        }
        else if (data.body.type == "Text") { // Gelen mesaj
            if (data.body.direction == "Outbound" && data.body.text) { // Agent mesajı
                addNewMessage("agent", linkify(data.body.text), timeFormatter(data.body.channel.time));
                $("#typing").hide(); // Mesaj gelince yazıyor kısmını gizle.
                messageSound(); // Mesaj gelince ses çal.
                    
                window.parent.postMessage("newMessage", pBaseUrl); // Yeni mesaj geldiği bilgisini ver.

                // Agent bilgilerini aşağıdaki gibi alıp kullanabiliriz.
                var agentNickName = data.body.channel.from.nickname;
                var agentProfileImage = data.body.channel.from.image;
            }
            else if (data.body.direction == "Inbound" && data.body.text) { // Müşteri mesajı
                addNewMessage("participant", linkify(data.body.text), timeFormatter(data.body.channel.time));
            }
            else if (data.body.direction == "Outbound" && data.body.content) { // Agent dan gelen içerik
                data.body.content.forEach(content => {
                    if (content.contentType == "Attachment") { // Gelen bir dosya
                        addNewMessage("agent", linkify(content.attachment.url), timeFormatter(data.body.channel.time));
                        $("#typing").hide(); // Mesaj gelince yazıyor kısmını gizle.
                        messageSound(); // Mesaj gelince ses çal.
                            
                        window.parent.postMessage("newMessage", pBaseUrl); // Yeni mesaj geldiği bilgisini ver.
                    }
                });
            }
        }
        else {
            console.log("Desteklenmeyen mesaj türü!");
        }
    }
}

function streamOnOpen(event){
    console.log("### OPEN ###");
    console.log(event);

    createNewSession(false); // Wss bağlandığında bir session başlatıyoruz
}

function streamOnClose(event){
    console.log("### CLOSE ###");
    console.log(event.data);
}

function streamOnError(event){
    console.log("### ERROR ###");
    console.log(event.data);
}

function clearCookies() {
    //deleteCookie("cxLastMessageId");
}

function timeFormatter(time) {
    var _time = new Date(time);
    return (_time.getHours() > "9" ? _time.getHours() : "0" + _time.getHours()) + ":" + (_time.getMinutes() > "9" ? _time.getMinutes() : "0" + _time.getMinutes()); // + ":" + (_time.getSeconds() > "9" ? _time.getSeconds() : "0" + _time.getSeconds());
}

function messageSound(){
    var audio = new Audio('./sounds/Crystal.mp3'); // Crystal_Drop.mp3
    audio.play();
}

function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=_|!:,.;]*[-A-Z0-9+&@#\/%=_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;

}
