var Popup = function() {
    this.initialize();
};

Popup.prototype = {
    initialize: function() {
        this.bg = chrome.extension.getBackgroundPage();
    },
    start: function() {
        this.assignMessages();
        this.assignEventHandlers();

        this.bg.ic.getSelectedTabImageInfo(function(info) {
            this.onReceiveImageInfo(info);
        }.bind(this));
    },
    assignMessages: function() {
        $("btnCopy").innerHTML = chrome.i18n.getMessage("popupBtnCopy");
    },
    assignEventHandlers: function() {
        $("btnCopy").onclick = this.onClickCopy.bind(this);
    },
    onReceiveImageInfo: function(info) {
        this.setImages(info);
        var script = this.createScript(info);
        this.setUrls(script);
        this.setSaveLink(script);
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
    setSaveLink: function(script) {
        var blobBuilder = new WebKitBlobBuilder();
        blobBuilder.append(script);
        var a = document.createElement("a");
        a.href = window.webkitURL.createObjectURL(blobBuilder.getBlob());
        a.target = "_blank";
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
    }
};

var popup = new Popup();
