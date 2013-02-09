var IC = function() {
    this.initialize();
};

IC.SERVER_URL = "http://ics.eisbahn.jp/";

IC.prototype = {
    initialize: function() {
        this.setupEventHandler();
        this.setupContextMenus();
        this.setupBookmark();
    },
    getServerUrl: function() {
        return IC.SERVER_URL;
    },
    setupEventHandler: function() {
        chrome.runtime.onStartup.addListener(function() {
            this.establishSession();
        }.bind(this));
        chrome.runtime.onInstalled.addListener(function() {
            this.establishSession();
        }.bind(this));
        chrome.tabs.onUpdated.addListener(function(id, changeInfo, tab) {
            if (changeInfo.status == "complete") {
                this.onSelectionChanged(id);
            }
        }.bind(this));
        chrome.tabs.onRemoved.addListener(function(id, removeInfo) {
            this.deleteTabImageInfo(id);
        }.bind(this));
        chrome.extension.onMessage.addListener(
            function(message, sender, sendRequest) {
                this.onRequest(message, sender.tab, sendRequest);
            }.bind(this)
        );
        chrome.contextMenus.onClicked.addListener(function(info, tab) {
            this.onClickContextMenu(info, tab);
        }.bind(this));
    },
    setupContextMenus: function() {
        chrome.contextMenus.create({
            id: "menuReloadImages",
            type: "normal",
            title: chrome.i18n.getMessage("menuReloadImages"),
            contexts: ["page"]
        });
    },
    onClickContextMenu: function(info, tab) {
        if (info.menuItemId == "menuReloadImages") {
            this.reloadImages(tab);
        }
    },
    establishSession: function() {
        var url = this.getServerUrl() + "ajax/create_session";
        var token = this.getSessionToken();
        var params = {
            has_token: token != undefined
        };
        if (token) {
            params.token = token;
        }
        new Ajax.Request(url, {
            method: "post",
            parameters: params,
            onSuccess: function(req) {
                this.onReceiveEstablishSession(req);
            }.bind(this),
            onFailure: function(req) {
                console.log(req);
            }.bind(this)
        });
    },
    onReceiveEstablishSession: function(req) {
        var result = req.responseJSON.result;
        var token = result.token;
        localStorage["session_token"] = token;
    },
    getSessionToken: function() {
        return localStorage["session_token"];
    },
    onRequest: function(message, tab, sendRequest) {
        if (message.type == "parsed_images") {
            var filteredImages = this.filterUrls(message.images);
            var urls = filteredImages.collect(function(image) {
                return image.url;
            });
            if (urls.length > 0) {
                this.setTabImageInfo(tab.id, {
                    urls: urls,
                    images: message.images,
                    filtered: filteredImages
                });
                chrome.pageAction.show(tab.id);
                chrome.pageAction.setTitle({
                    tabId: tab.id,
                    title: String(urls.length) + " images"
                });
                this.previewImages(filteredImages, tab);
            } else {
                this.deleteTabImageInfo(tab.id);
                chrome.pageAction.hide(tab.id);
                chrome.pageAction.setTitle({
                    tabId: tab.id,
                    title: ""
                });
            }
        } else if (message.type == "disable_button") {
            chrome.pageAction.hide(message.tabId);
        } else if (message.type == "dismiss_hotpreview") {
            localStorage["preview_position"] = "none";
        }
        sendRequest({});
    },
    reloadImages: function(tab) {
        this.deleteTabImageInfo(tab.id);
        chrome.pageAction.hide(tab.id);
        this.executeContentScript(tab.id);
    },
    onSelectionChanged: function(tabId) {
        this.executeContentScript(tabId);
    },
    executeContentScript: function(tabId) {
        chrome.tabs.executeScript(tabId, {
            file: "content_script.js"
        });
    },
    getSelectedTabImageInfo: function(callback) {
        chrome.tabs.getSelected(null, function(tab) {
            callback(this.getTabImageInfo(tab.id), tab.title, tab.url);
        }.bind(this));
    },
    getTabImageInfo: function(tabId) {
        var info = localStorage["tab_" + String(tabId)];
        return info.evalJSON();
    },
    setTabImageInfo: function(tabId, info) {
        localStorage["tab_" + String(tabId)] = Object.toJSON(info);
    },
    deleteTabImageInfo: function(tabId) {
        localStorage.removeItem("tab_" + String(tabId));
    },
    filterUrls: function(images) {
        var filterExts = utils.split(this.getFilterExts(), " ");
        var filterExcepts = utils.split(this.getFilterExcepts(), " ");
        var filterSizeWidth = Number(this.getFilterSizeWidth());
        var filterSizeHeight = Number(this.getFilterSizeHeight());
        var result = new Array();
        images.each(function(image) {
            var url = image.url;
            var flag = false;
            if (filterExts.length > 0) {
                for (var i = 0; i < filterExts.length; i++) {
                    if (url.toLowerCase().indexOf(
                        "." + filterExts[i].toLowerCase()) != -1) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) return;
            }
            flag = false;
            for (var i = 0; i < filterExcepts.length; i++) {
                if (url.toLowerCase().indexOf(filterExcepts[i]) != -1) {
                    flag = true;
                    break;
                }
            }
            if (flag) return;
            var width = Number(image.width);
            if (width < filterSizeWidth) return;
            var height = Number(image.height);
            if (height < filterSizeHeight) return;
            if (image.tag == "img") {
                if (this.isPriorityLinkHref() && image.hasLink) return;
            }
            result.push(image);
        }.bind(this));
        return result;
    },
    getCommandTemplate: function() {
        return utils.getOptionValue("command_template", "curl -O -L $url");
    },
    getFilterExts: function() {
        return utils.getOptionValue("filter_exts", "jpeg jpg");
    },
    getFilterExcepts: function() {
        return utils.getOptionValue("filter_excepts", "amazon");
    },
    getFilterSizeWidth: function() {
        return utils.getOptionValue("filter_size_width", "300");
    },
    getFilterSizeHeight: function() {
        return utils.getOptionValue("filter_size_height", "300");
    },
    isPriorityLinkHref: function() {
        return Boolean(localStorage["priority_link_href"]);
    },
    getDownloadFilename: function() {
        return utils.getOptionValue("download_filename", "");
    },
    endsWith: function(source, suffix) {
        var sub = source.length - suffix.length;
        return (sub >= 0) && (source.lastIndexOf(suffix) === sub);
    },
    checkDropboxAuthorized: function(callbacks) {
        this.checkServiceAuthorized("dropbox", callbacks);
    },
    checkGDriveAuthorized: function(callbacks) {
        this.checkServiceAuthorized("gdrive", callbacks);
    },
    checkSDriveAuthorized: function(callbacks) {
        this.checkServiceAuthorized("sdrive", callbacks);
    },
    checkServiceAuthorized: function(name, callbacks) {
        var token = this.getSessionToken();
        var url = this.getServerUrl() + "ajax/is_valid_" + name;
        new Ajax.Request(url, {
            method: "post",
            parameters: {
                token: token
            },
            onSuccess: function(req) {
                callbacks.onSuccess(req);
            }.bind(this),
            onFailure: function(req) {
                console.log(req);
            }.bind(this)
        });
    },
    saveToDropbox: function(title, pageUrl, urls, callbacks) {
        this.saveToService("dropbox", title, pageUrl, urls, callbacks);
    },
    saveToGDrive: function(title, pageUrl, urls, callbacks) {
        this.saveToService("gdrive", title, pageUrl, urls, callbacks);
    },
    saveToSDrive: function(title, pageUrl, urls, callbacks) {
        this.saveToService("sdrive", title, pageUrl, urls, callbacks);
    },
    saveToLocal: function(title, pageUrl, urls, callbacks) {
        this.saveToService("local", title, pageUrl, urls, callbacks);
    },
    saveToService: function(name, title, pageUrl, urls, callbacks) {
        var url = this.getServerUrl() + "ajax/save_to_" + name;
        new Ajax.Request(url, {
            method: "post",
            parameters: {
                token: this.getSessionToken(),
                title: title,
                page_url: pageUrl,
                urls: urls.join(" "),
                create_dir: !this.isWithoutCreatingFolder()
            },
            onSuccess: function(req) {
                this.createPageBookmark(title, pageUrl);
                callbacks.onSuccess(req);
            }.bind(this),
            onFailure: function(req) {
                callbacks.onFailure(req);
            }.bind(this)
        });
    },
    cancelDropbox: function(callbacks) {
        this.cancelService("dropbox", callbacks);
    },
    cancelGDrive: function(callbacks) {
        this.cancelService("gdrive", callbacks);
    },
    cancelSDrive: function(callbacks) {
        this.cancelService("sdrive", callbacks);
    },
    cancelService: function(name, callbacks) {
        var url = this.getServerUrl() + "ajax/cancel_" + name;
        new Ajax.Request(url, {
            method: "post",
            parameters: {
                token: this.getSessionToken()
            },
            onSuccess: function(req) {
                callbacks.onSuccess(req);
            }.bind(this),
            onFailure: function(req) {
                callbacks.onFailure(req);
            }.bind(this)
        });
    },
    getDropboxAuthUrl: function() {
        return this.getServiceAuthUrl("dropbox");
    },
    getGdriveAuthUrl: function() {
        return this.getServiceAuthUrl("gdrive");
    },
    getSdriveAuthUrl: function() {
        return this.getServiceAuthUrl("sdrive");
    },
    getServiceAuthUrl: function(name) {
        var token = this.getSessionToken();
        var optionUrl = chrome.extension.getURL("options.html");
        var url =
            this.getServerUrl() + "auth_" + name + "?"
            + "token=" + token
            + "&callback=" + encodeURIComponent(optionUrl);
        return url;
    },
    isWithoutCreatingFolder: function() {
        return Boolean(localStorage["without_creating_folder"]);
    },
    isDontCreatePageBookmark: function() {
        return Boolean(localStorage["dont_create_page_bookmark"]);
    },
    loadMonitor: function(callbacks) {
        var url = this.getServerUrl() + "monitor";
        new Ajax.Request(url, {
            method: "get",
            onSuccess: function(req) {
                callbacks.onSuccess(req);
            }.bind(this)
        });
    },
    downloadLocal: function(images) {
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.sendMessage(tab.id, {
                operation: "download_local",
                images: images
            });
        }.bind(this));
    },
    goToImage: function(url) {
        chrome.tabs.getSelected(null, function(tab) {
            var images = this.getTabImageInfo(tab.id).images;
            var pos = -1;
            for (var i = 0; i < images.length; i++) {
                var image = images[i];
                if (image.url == url) {
                    pos = image.pos;
                    break;
                }
            }
            chrome.tabs.sendMessage(tab.id, {
                operation: "go_to_image",
                pos: pos
            });
        }.bind(this));
    },
    previewImages: function(images, tab) {
        var previewPosition = this.getPreviewPosition();
        if (previewPosition != "none") {
            chrome.tabs.sendMessage(tab.id, {
                operation: "preview_images",
                images: images,
                position: previewPosition,
                tabId: tab.id
            });
        }
    },
    getPreviewPosition: function() {
        return utils.getOptionValue("preview_position", "bottom_right");
    },
    startSlideShow: function(callback) {
        chrome.tabs.getSelected(null, function(tab) {
            var url = chrome.extension.getURL(
                "slideshow/slideshow.html?tab_id=" + tab.id);
            chrome.tabs.create({
                url: url
            }, function(tab) {
                callback();
            });
        });
    },
    setupBookmark: function() {
        if (this.isDontCreatePageBookmark()) {
            return;
        }
        var bookmarkId = this.getExtensionBookmarkId();
        if (!bookmarkId) {
            this.createExtensionBookmark();
        } else {
            chrome.bookmarks.get(bookmarkId, function(result) {
                if (!result) {
                    this.createExtensionBookmark();
                }
            }.bind(this));
        }
    },
    createExtensionBookmark: function() {
        chrome.bookmarks.create({
            title: "Image Collector extension"
        }, function(result) {
            localStorage["extension_bookmark_id"] = result.id;
        });
    },
    getExtensionBookmarkId: function() {
        return localStorage["extension_bookmark_id"];
    },
    createPageBookmark: function(title, url) {
        if (this.isDontCreatePageBookmark()) {
            return;
        }
        var parentId = this.getExtensionBookmarkId();
        chrome.bookmarks.create({
            parentId: parentId,
            title: title,
            url: url
        });
    }
};

var ic = new IC();
