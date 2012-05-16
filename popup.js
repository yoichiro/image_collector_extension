var Popup = function() {
    this.initialize();
};

Popup.prototype = {
    initialize: function() {
        this.imageInfo = null;
        this.tabTitle = null;
	this.tabUrl = null;
        this.bg = chrome.extension.getBackgroundPage();
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
            "popupImageCount": "popupImageCount"
        };
        utils.setMessageResources(hash);
    },
    assignEventHandlers: function() {
        $("btnCopy").onclick = this.onClickCopy.bind(this);
        $("btnDropbox").onclick = this.onClickDropbox.bind(this);
        this.bg.ic.checkDropboxAuthorized({
            onSuccess: function(req) {
                var result = req.responseJSON.result;
                utils.setVisible($("btnDropbox"), result);
            }.bind(this)
        });
    },
    onReceiveImageInfo: function(info, title, url) {
        this.imageInfo = info;
        this.tabTitle = title;
	this.tabUrl = url;
        this.showInfo(info);
        this.setImages(info);
        var script = this.createScript(info);
        this.setUrls(script);
        this.setSaveLink(script, title);
    },
    showInfo: function(info) {
        $("image_count").innerHTML = info.urls.length;
    },
    createScript: function(info) {
        var template = this.bg.ic.getCommandTemplate();
        var urls = info.urls;
        var script = "";
        urls.each(function(url) {
            var command = template.replace("$url", url);
            script += command + "\n";
        });
        return script;
    },
    setUrls: function(script) {
        $("commands").innerHTML = script;
    },
    setImages: function(info) {
        var images = $("images");
        images.innerHTML = "";
        var urls = info.urls;
        urls.each(function(url) {
            var link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            images.appendChild(link);
            var img = document.createElement("img");
            img.src = url;
            link.appendChild(img);
            images.appendChild(document.createElement("br"));
        }.bind(this));
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
            this.imageInfo,
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
    }
};

var popup = new Popup();
