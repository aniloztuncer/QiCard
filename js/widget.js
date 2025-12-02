        var cxNewMessage = 0;
        var cxPageTitle = "";

        function widgetInit() {
            var _cxLiveChatScript = document.getElementById("cx-live-chat");
            var _baseUrl = _cxLiveChatScript.getAttribute("base-url");
            var _iconSrc = _cxLiveChatScript.getAttribute("icon-src");
            var _iconTitle = _cxLiveChatScript.getAttribute("icon-title");

            var _widgetCss = document.createElement("link");
            _widgetCss.href = _baseUrl + "/css/widget.css";
            _widgetCss.rel = "stylesheet";
            document.head.append(_widgetCss);
            
            var _widgetIcon = document.createElement("div");
            _widgetIcon.id = "cx-widget-icon";
            var _widgetIconImg = document.createElement("img");
            _widgetIconImg.src = _iconSrc ?? _baseUrl + "/img/widget-default-icon.svg";
            _widgetIconImg.title = _iconTitle ?? "";
            _widgetIconImg.onclick = widgetToggle;
            _widgetIcon.append(_widgetIconImg);

            var _widgetCounter = document.createElement("span");
            _widgetCounter.id = "cx-widget-counter";
            _widgetCounter.style =  "display:none;";

            if (checkCookie("cxNewMessage") && getCookie("cxNewMessage") > 0) {
                _widgetCounter.style = "display:block;"
                _widgetCounter.innerHTML = getCookie("cxNewMessage");
                cxNewMessage = getCookie("cxNewMessage");
                cxPageTitle = cxPageTitle.length > 0 ? cxPageTitle : document.title;
                document.title = "💬 " + cxPageTitle;
            }

            _widgetIcon.append(_widgetCounter);
            document.body.append(_widgetIcon);

            if (checkCookie("cxWidgetOpen") && getCookie("cxWidgetOpen") == "true") {
                widgetOpen();
            }
            else if (checkCookie("cxConversationStarted")) {
                if (cxNewMessage > 0) {
                    widgetOpen();
                }
                else {
                    widgetOpen(true);
                }
            }
        }

        widgetInit();

        function widgetOpen(isHidden = false) {
            var _cxLiveChatScript = document.getElementById("cx-live-chat");
            var _baseUrl = _cxLiveChatScript.getAttribute("base-url");
            var _language = _cxLiveChatScript.getAttribute("widget-lang");
            var _widgetWidth = _cxLiveChatScript.getAttribute("widget-width");
            var _widgetHeight = _cxLiveChatScript.getAttribute("widget-height");
            var _userData = _cxLiveChatScript.getAttribute("user-data");
            var _queueName = _cxLiveChatScript.getAttribute("queue-name");

            var _widgetFrame = document.getElementById("cx-widget-frame");

            if(_widgetFrame) {
                _widgetFrame.style.display = "block";
                widgetNewMessageReset();
            }
            else { 
                var lang = "?lang=" + (_language ? _language : "en");
                var usrData = "&userdata=" + (_userData ? _userData : "");
                var baseUrl = "&baseurl=" + window.location.href;
                var queue = "&queue=" + (_queueName ? _queueName : "");

                var _params = lang + usrData + baseUrl + queue;

                _widgetFrame = document.createElement("iframe");
                _widgetFrame.src = _baseUrl + "/index.html" + _params;
                _widgetFrame.id = "cx-widget-frame";
                _widgetFrame.width = _widgetWidth ?? 320;
                _widgetFrame.height = _widgetHeight ?? 600;
                _widgetFrame.style.display = isHidden ? "none" : "block";
                document.body.append(_widgetFrame);
            }

            if (!isHidden) {
                setCookie("cxWidgetOpen", "true", 60);
                widgetNewMessageReset();
            }
        }

        function widgetClose() {
            var _widgetFrame = document.getElementById("cx-widget-frame");
            if(_widgetFrame) { 
                _widgetFrame.style.display = "none";
                deleteCookie("cxWidgetOpen");
            }
        }

        function widgetRemove() {
            var _widgetFrame = document.getElementById("cx-widget-frame");
            if(_widgetFrame) { 
                _widgetFrame.remove();
                widgetNewMessageReset();
                deleteCookie("cxWidgetOpen");
            }
        }

        function widgetToggle() {
            var _widgetFrame = document.getElementById("cx-widget-frame");
            if(_widgetFrame && _widgetFrame.style.display == "block") widgetClose();
            else widgetOpen();
        }

        function widgetNewMessageReset(){            
            cxNewMessage = 0;
            setCookie("cxNewMessage", 0, 5);
            deleteCookie("cxNewMessage");

            var _counter = document.getElementById("cx-widget-counter");
            _counter.style.display = "none";
            _counter.innerHTML = cxNewMessage;
            document.title = cxPageTitle;
        }

        // Event listener for frame
        window.parent.addEventListener("message", event => {
            if(event.data == "widgetClose") {
                var _widgetFrame = document.getElementById("cx-widget-frame");
                if(_widgetFrame) { 
                    _widgetFrame.style.display = "none";
                    deleteCookie("cxWidgetOpen");
                }
            }
            else if (event.data == "widgetRemove") {
                var _widgetFrame = document.getElementById("cx-widget-frame");
                if(_widgetFrame) { 
                    _widgetFrame.remove();     
                    widgetNewMessageReset();               
                    deleteCookie("cxWidgetOpen");
                }
            }
            else if (event.data == "newMessage") {
                var _widgetFrame = document.getElementById("cx-widget-frame");
                if (_widgetFrame && _widgetFrame.style.display == 'none') {
                    cxNewMessage++;
                    setCookie("cxNewMessage", cxNewMessage, 60);

                    var _counter = document.getElementById("cx-widget-counter");
                    _counter.style.display = "block";
                    _counter.innerHTML = cxNewMessage;

                    if(cxNewMessage > 0) {
                        cxPageTitle = cxPageTitle.length > 0 ? cxPageTitle : document.title;
                        document.title = "💬 " + cxPageTitle;
                    }
                }
            }
            else if (event.data == "reConnectNewMessages") {
                widgetOpen();
            }
            else if (event.data == "conversationStarted") {
                setCookie("cxConversationStarted", true, 60);
            }
            else if (event.data == "conversationEnded") {
                deleteCookie("cxConversationStarted");
            }
        });

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