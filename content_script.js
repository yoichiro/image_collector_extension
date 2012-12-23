if (typeof CS == "undefined") {
    CS = function() {
        this.initialize();
    };

    CS.prototype = {
        initialize: function() {
        },
        start: function() {
            var self = this;
            var images = this.getImages();
            this.sendImagesMessage(images);
            chrome.extension.onMessage.addListener(
                this.hitch(function(message, sender) {
                    this.onReceiveMessage(message, sender);
                })
            );
        },
        onReceiveMessage: function(message, sender) {
            var operation = message.operation;
            if (operation == "download_local") {
                var container = document.getElementById("ics_container");
                if (!container) {
                    container = document.createElement("div");
                    container.id = "ics_container";
                    container.style.display = "none";
                    document.body.appendChild(container);
                }
                for (var i = 0; i < message.images.length; i++) {
                    var url = message.images[i];
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
            } else if (operation == "preview_images") {
                var images = message.images;
                var position = message.position;
                var tabId = message.tabId;
                this.previewImages(images, position, tabId);
            }
        },
        getImages: function() {
            var imgs = document.getElementsByTagName("img");
            var images = new Array();
            for (var i = 0; i < imgs.length; i++) {
                if (imgs[i].dataset.ics) {
                    continue;
                }
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
        sendImagesMessage: function(images) {
            var message = {
                type: "parsed_images",
                images: images
            };
            chrome.extension.sendRequest(message);
        },
        previewImages: function(images, position, tabId) {
            var panel = this.createPreviewPanel(position);
            document.body.appendChild(panel);
            this.createPreviewClose(panel);
            this.createPreviewImages(images, panel, tabId);
        },
        createPreviewPanel: function(position) {
            var panel = document.getElementById("ics_preview_panel");
            if (panel) {
                panel.innerHTML = "";
            } else {
                panel = document.createElement("div");
                panel.id = "ics_preview_panel";
                panel.style.position = "fixed";
                panel.style.width = "70px";
                if (position.indexOf("top") != -1) {
                    panel.style.top = 0;
                }
                if (position.indexOf("bottom") != -1) {
                    panel.style.bottom = 0;
                }
                if (position.indexOf("left") != -1) {
                    panel.style.left = 0;
                }
                if (position.indexOf("right") != -1) {
                    panel.style.right = 0;
                }
                panel.style.overflow = "auto";
                panel.style.paddingBottom = "5px";
            }
            return panel;
        },
        createPreviewImages: function(images, panel, tabId) {
            var failedImageCount = 0;
            for (var i = 0; i < images.length; i++) {
                var img = document.createElement("img");
                img.src = images[i].url;
                img.style.width = "45px";
                img.style.marginLeft = "5px";
                img.style.marginRight = "5px";
                img.style.marginTop = "5px";
                img.style.cursor = "pointer";
                img.dataset.ics = "true";
                img.onclick = (function(image) {
                    return function(evt) {
                        var pos = image.pos;
                        window.scrollTo(-1, pos);
                    };
                })(images[i]);
                img.onerror = this.hitch((function(img) {
                    return function() {
                        panel.removeChild(img);
                        failedImageCount++;
                        if (failedImageCount >= images.length) {
                            document.body.removeChild(panel);
                            this.sendDisableButtonMessage(tabId);
                        }
                    }
                })(img));
                if (i == images.length - 1) {
                    img.onload = this.hitch(function() {
                        this.adjustPreviewPanelHeight(panel);
                    });
                }
                panel.appendChild(img);
            }
        },
        sendDisableButtonMessage: function(tabId) {
            var message = {
                type: "disable_button",
                tabId: tabId
            };
            chrome.extension.sendRequest(message);
        },
        adjustPreviewPanelHeight: function(panel) {
            var clientHeight = document.documentElement.clientHeight;
            if (panel.clientHeight > (clientHeight / 2)) {
                panel.style.height = String(clientHeight / 2) + "px";
            }
        },
        createPreviewClose: function(panel) {
            var close = document.createElement("div");
            close.style.textAlign = "center";
            close.style.textDecoration = "underline";
            close.style.cursor = "pointer";
            close.style.fontSize = "9px";
            close.style.marginTop = "5px";
            close.appendChild(document.createTextNode("Close"));
            panel.appendChild(close);
            close.onclick = function(evt) {
                document.body.removeChild(panel);
            };
        },
        hitch: function(f) {
            var self = this;
            return function() {
                f.apply(self, arguments);
            };
        }
    };
}

var cs = new CS();
cs.start();
