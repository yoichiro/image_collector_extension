var CS = function() {
    this.initialize();
};

CS.prototype = {
    initialize: function() {
    },
    start: function() {
        var images = this.getImages();
        this.sendMessage(images);
    },
    getImages: function() {
        var imgs = document.getElementsByTagName("img");
        var images = new Array();
        for (var i = 0; i < imgs.length; i++) {
            var imgSrc = imgs[i].src;
            images.push({
                tag: "img",
                url: imgSrc,
                width: imgs[i].naturalWidth,
                height: imgs[i].naturalHeight
            });
            var parent = imgs[i].parentNode;
            if (parent.nodeType == Node.ELEMENT_NODE
                && parent.nodeName.toLowerCase() == "a") {
                var href = parent.href;
                if (href != imgSrc) {
                    images.push({
                        tag: "a",
                        url: href,
                        width: Number.MAX_VALUE,
                        height: Number.MAX_VALUE
                    });
                }
            }
        }
        return images;
    },
    sendMessage: function(images) {
        var message = {images: images};
        chrome.extension.sendRequest(message);
    }
};

var cs = new CS();
cs.start();