var Popup = function() {
    this.initialize();
};

Popup.prototype = {
    initialize: function() {
        this.imageInfo = null;
        this.tabTitle = null;
        this.tabUrl = null;
        this.deletedUrls = new Array();
        this.bg = chrome.extension.getBackgroundPage();
        window.addEventListener("load", function(evt) {
            this.start();
        }.bind(this));
    },
    start: function() {
        this.assignMessages();
        this.assignEventHandlers();

        this.bg.ic.getSelectedTabImageInfo(function(info, title, url) {
            this.onReceiveImageInfo(info, title, url);
        }.bind(this));
    },
    assignMessages: function() {
        var hash = {
            "btnCopy": "popupBtnCopy",
            "popupImageCount": "popupImageCount",
            "btnDropbox": "popupBtnDropbox",
            "btnAuthDropbox": "popupBtnAuthDropbox",
            "btnGdrive": "popupBtnGdrive",
            "btnAuthGdrive": "popupBtnAuthGdrive",
            "btnSdrive": "popupBtnSdrive",
            "btnAuthSdrive": "popupBtnAuthSdrive"
        };
        utils.setMessageResources(hash);
    },
    assignEventHandlers: function() {
        $("btnCopy").onclick = this.onClickCopy.bind(this);
        $("btnDropbox").onclick = this.onClickDropbox.bind(this);
        $("btnAuthDropbox").onclick = this.onClickAuthDropbox.bind(this);
        $("btnGdrive").onclick = this.onClickGdrive.bind(this);
        $("btnAuthGdrive").onclick = this.onClickAuthGdrive.bind(this);
        $("btnSdrive").onclick = this.onClickSdrive.bind(this);
        $("btnAuthSdrive").onclick = this.onClickAuthSdrive.bind(this);
        this.bg.ic.checkDropboxAuthorized({
            onSuccess: function(req) {
                var result = req.responseJSON.result;
                utils.setVisible($("btnDropbox"), result);
                utils.setVisible($("btnAuthDropbox"), !result);
            }.bind(this)
        });
        this.bg.ic.checkGDriveAuthorized({
            onSuccess: function(req) {
                var result = req.responseJSON.result;
                utils.setVisible($("btnGdrive"), result);
                utils.setVisible($("btnAuthGdrive"), !result);
            }.bind(this)
        });
        this.bg.ic.checkSDriveAuthorized({
            onSuccess: function(req) {
                var result = req.responseJSON.result;
                utils.setVisible($("btnSdrive"), result);
                utils.setVisible($("btnAuthSdrive"), !result);
            }.bind(this)
        });
        $("btnOption").onclick = this.onClickOption.bind(this);
    },
    onClickOption: function(evt) {
        var url = chrome.extension.getURL("options.html");
        chrome.tabs.create({
            url: url
        }, function(tab) {
            window.close();
        }.bind(this));
    },
    onReceiveImageInfo: function(info, title, url) {
        this.imageInfo = info;
        this.tabTitle = title;
        this.tabUrl = url;
        this.showInfo(info);
        this.setImages(info);
        var script = this.createScript();
        this.setScript(script);
        this.setSaveLink(script, title);
    },
    showInfo: function(info) {
        $("image_count").innerHTML = info.urls.length;
    },
    createScript: function() {
        var template = this.bg.ic.getCommandTemplate();
        var urls = this.getFinalUrls();
        var script = "";
        urls.each(function(url) {
            var command = template.replace("$url", url);
            script += command + "\n";
        });
        return script;
    },
    getFinalUrls: function() {
        var result = new Array();
        this.imageInfo.urls.each(function(url) {
            if (!this.deletedUrls.include(url)) {
                result.push(url);
            }
        }.bind(this));
        return result;
    },
    setScript: function(script) {
        $("commands").innerHTML = script;
    },
    setImages: function(info) {
        var images = $("images");
        images.innerHTML = "";
        var urls = info.urls;
        urls.each(function(url) {
            var parent = document.createElement("div");
            var link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            parent.appendChild(link);
            var img = document.createElement("img");
            img.src = url;
            img.addClassName("content");
            link.appendChild(img);
            parent.appendChild(document.createElement("br"));
            var div = document.createElement("div");
            div.addClassName("image_function");
            this.appendTwitter(div, url);
            this.appendFacebook(div, url);
            this.appendDelete(div, url, parent);
            parent.appendChild(div);
            images.appendChild(parent);
        }.bind(this));
    },
    appendDelete: function(div, url, parent) {
        var self = this;
        var img = document.createElement("img");
        img.setAttribute("src", "./delete.png");
        img.addClassName("delete");
        div.appendChild(img);
        img.onclick = function(url, div) {
            return function(evt) {
                Element.setStyle(div, {
                    display: "none"
                });
                this.deletedUrls.push(url);
                var script = this.createScript();
                this.setScript(script);
            }.bind(self);
        }.bind(this)(url, parent);
    },
    appendTwitter: function(parent, url) {
        var self = this;
        var img = document.createElement("img");
        img.setAttribute("src", "./twitter.png");
        parent.appendChild(img);
        img.onclick = function(url) {
            return function(evt) {
                this.openTweetWindow(url);
            }.bind(self);
        }.bind(this)(url);
    },
    openTweetWindow: function(url) {
        window.open(
            "https://twitter.com/share?url="
                + encodeURIComponent(url),
            "_blank",
            "width=550,height=450");
    },
    appendFacebook: function(parent, url) {
        var self = this;
        var img = document.createElement("img");
        img.setAttribute("src", "./facebook_16.png");
        parent.appendChild(img);
        img.onclick = function(url) {
            return function(evt) {
                this.openFacebookWindow(url);
            }.bind(self);
        }.bind(this)(url);
    },
    openFacebookWindow: function(url) {
        var link = "http://www.facebook.com/sharer/sharer.php?u="
            + encodeURIComponent(url);
        window.open(
            link,
            "_blank",
            "width=680,height=360");
    },
    setSaveLink: function(script, title) {
        var blobBuilder = new WebKitBlobBuilder();
        blobBuilder.append(script);
        var a = document.createElement("a");
        a.href = window.webkitURL.createObjectURL(blobBuilder.getBlob());
        var filename = this.bg.ic.getDownloadFilename();
        filename = filename.replace("$tabname", title);
        a.download = filename;
        a.onclick = function(evt) {
            var message = chrome.i18n.getMessage("popupSavedFile");
            this.showMessage(message);
            return true;
        }.bind(this);
        var label = chrome.i18n.getMessage("popupBtnSave");
        a.appendChild(document.createTextNode(label));
        $("command_pane").appendChild(a);
    },
    showMessage: function(message) {
        $("message").innerHTML = message;
        setTimeout(function() {
            this.showMessage("");
        }.bind(this), 5000);
    },
    copyToClipboard: function() {
        $("commands").focus();
        $("commands").select();
        document.execCommand("copy");
        this.showMessage(chrome.i18n.getMessage("popupCopied"));
    },
    onClickCopy: function(evt) {
        this.copyToClipboard();
    },
    onClickDropbox: function(evt) {
        Element.setStyle($("btnDropbox"),
                         {display: "none"});
        this.bg.ic.saveToDropbox(
            this.tabTitle,
            this.tabUrl,
            this.getFinalUrls(),
            {
                onSuccess: function(req) {
                    if (req.responseJSON.result) {
                        this.showMessage(chrome.i18n.getMessage("popupSavedToDropbox"));
                    } else {
                        this.showMessage(chrome.i18n.getMessage("popupSavedToDropboxFail"));
                    }
                    Element.setStyle($("btnDropbox"),
                                     {display: "inline-block"});
                }.bind(this),
                onFailure: function(req) {
                    console.log(req);
                }.bind(this)
            }
        );
    },
    onClickGdrive: function(evt) {
        Element.setStyle($("btnGdrive"),
                         {display: "none"});
        this.bg.ic.saveToGDrive(
            this.tabTitle,
            this.tabUrl,
            this.getFinalUrls(),
            {
                onSuccess: function(req) {
                    if (req.responseJSON.result) {
                        this.showMessage(chrome.i18n.getMessage("popupSavedToGDrive"));
                    } else {
                        this.showMessage(chrome.i18n.getMessage("popupSavedToGDriveFail"));
                    }
                    Element.setStyle($("btnGdrive"),
                                     {display: "inline-block"});
                }.bind(this),
                onFailure: function(req) {
                    console.log(req);
                }.bind(this)
            }
        );
    },
    onClickSdrive: function(evt) {
        Element.setStyle($("btnSdrive"),
                         {display: "none"});
        this.bg.ic.saveToSDrive(
            this.tabTitle,
            this.tabUrl,
            this.getFinalUrls(),
            {
                onSuccess: function(req) {
                    if (req.responseJSON.result) {
                        this.showMessage(chrome.i18n.getMessage("popupSavedToSDrive"));
                    } else {
                        this.showMessage(chrome.i18n.getMessage("popupSavedToSDriveFail"));
                    }
                    Element.setStyle($("btnSdrive"),
                                     {display: "inline-block"});
                }.bind(this),
                onFailure: function(req) {
                    console.log(req);
                }.bind(this)
            }
        );
    },
    onClickAuthDropbox: function(evt) {
        var url = this.bg.ic.getDropboxAuthUrl();
        chrome.tabs.create({
            url: url,
            selected: true
        });
    },
    onClickAuthGdrive: function(evt) {
        var url = this.bg.ic.getGdriveAuthUrl();
        chrome.tabs.create({
            url: url,
            selected: true
        });
    },
    onClickAuthSdrive: function(evt) {
        var url = this.bg.ic.getSdriveAuthUrl();
        chrome.tabs.create({
            url: url,
            selected: true
        });
    }
};

var popup = new Popup();
