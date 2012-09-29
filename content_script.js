if (typeof CS == "undefined") {
    CS = function() {
        this.initialize();
    };

    CS.prototype = {
        initialize: function() {
        },
        start: function() {
            var images = this.getImages();
            this.sendMessage(images);
            chrome.extension.onMessage.addListener(function(message, sender) {
                var container = document.getElementById("ics_container");
                if (!container) {
                    container = document.createElement("div");
                    container.id = "ics_container";
                    container.style.display = "none";
                    document.body.appendChild(container);
                }
                for (var i = 0; i < message.length; i++) {
                    var url = message[i];
                    console.log(url);
                    var link = document.createElement("a");
                    link.href = url;
                    link.download = "";
                    container.appendChild(link);
                    link.click();
                }
                document.body.removeChild(container);
            });
        },
        getImages: function() {
            var imgs = document.getElementsByTagName("img");
            var images = new Array();
            for (var i = 0; i < imgs.length; i++) {
                var imgSrc = imgs[i].src;
                var img = {
                    tag: "img",
                    url: imgSrc,
                    width: imgs[i].naturalWidth,
                    height: imgs[i].naturalHeight,
                    hasLink: false
                };
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
                        img.hasLink = true;
                    }
                }
                images.push(img);
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
}
