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
                var operation = message.operation;
                if (operation == "download_local") {
                    var container = document.getElementById("ics_container");
                    if (!container) {
                        container = document.createElement("div");
                        container.id = "ics_container";
                        container.style.display = "none";
                        document.body.appendChild(container);
                    }
                    var images = message.images;
                    for (var i = 0; i < images.length; i++) {
                        var url = images[i];
                        var link = document.createElement("a");
                        link.href = url;
                        link.download = "";
                        container.appendChild(link);
                        link.click();
                    }
                    document.body.removeChild(container);
                } else if (operation == "go_to_image") {
                    var pos = message.pos;
                    window.scrollTo(-1, pos);
                }
            });
        },
        getImages: function() {
            var imgs = document.getElementsByTagName("img");
            var images = new Array();
            for (var i = 0; i < imgs.length; i++) {
                var imgSrc = imgs[i].src;
                var width = Math.max(imgs[i].width, imgs[i].naturalWidth);
                var height = Math.max(imgs[i].height, imgs[i].naturalHeight);
                var top = imgs[i].getBoundingClientRect().top;
                var img = {
                    tag: "img",
                    url: imgSrc,
                    width: width,
                    height: height,
                    hasLink: false,
                    pos: top
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
                            height: Number.MAX_VALUE,
                            pos:top
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
