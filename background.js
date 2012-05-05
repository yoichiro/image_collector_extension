var IC = function() {
    this.initialize();
};

IC.prototype = {
    initialize: function() {
        this.tabs = {};
        this.setupEventHandler();
    },
    setupEventHandler: function() {
        chrome.tabs.onSelectionChanged.addListener(function(id, info) {
            this.onSelectionChanged(id);
        }.bind(this));
        chrome.tabs.onUpdated.addListener(function(id, changeInfo, tab) {
            this.onSelectionChanged(id);
        }.bind(this));
        chrome.extension.onRequest.addListener(
            function(message, sender, sendRequest) {
                this.onRequest(message, sender.tab, sendRequest);
            }.bind(this)
        );
    },
    onRequest: function(message, tab, sendRequest) {
        var urls = this.filterUrls(message.images);
        if (urls.length > 0) {
            this.tabs[tab.id] = {urls: urls};
            chrome.pageAction.show(tab.id);
        } else {
            delete this.tabs[tab.id];
            chrome.pageAction.hide(tab.id);
        }
        sendRequest({});
    },
    onSelectionChanged: function(tabId) {
        chrome.tabs.executeScript(tabId, {
            file: "content_script.js"
        });
    },
    getSelectedTabImageInfo: function(callback) {
        chrome.tabs.getSelected(null, function(tab) {
            callback(this.tabs[tab.id]);
        }.bind(this));
    },
    filterUrls: function(images) {
        var filterExts = this.getFilterExts().split(" ");
        var filterExcepts = this.getFilterExcepts().split(" ");
        var filterSizeWidth = Number(this.getFilterSizeWidth());
        var filterSizeHeight = Number(this.getFilterSizeHeight());
        var result = new Array();
        images.each(function(image) {
            var url = image.url;
            var flag = false;
            for (var i = 0; i < filterExts.length; i++) {
                if (this.endsWith(url.toLowerCase(), "." + filterExts[i])) {
                    flag = true;
                    break;
                }
            }
            if (!flag) return;
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
            result.push(url);
        }.bind(this));
        return result;
    },
    getCommandTemplate: function() {
        var template = localStorage["command_template"];
        if (template) {
            return template;
        } else {
            return "curl -O -L $url";
        }
    },
    getFilterExts: function() {
        var filterExts = localStorage["filter_exts"];
        if (filterExts) {
            return filterExts;
        } else {
            return "jpeg jpg";
        }
    },
    getFilterExcepts: function() {
        var filterExcepts = localStorage["filter_excepts"];
        if (filterExcepts) {
            return filterExcepts;
        } else {
            return "amazon";
        }
    },
    getFilterSizeWidth: function() {
        var filterSizeWidth = localStorage["filter_size_width"];
        if (filterSizeWidth) {
            return filterSizeWidth;
        } else {
            return "300";
        }
    },
    getFilterSizeHeight: function() {
        var filterSizeHeight = localStorage["filter_size_height"];
        if (filterSizeHeight) {
            return filterSizeHeight;
        } else {
            return "300";
        }
    },
    endsWith: function(source, suffix) {
        var sub = source.length - suffix.length;
        return (sub >= 0) && (source.lastIndexOf(suffix) === sub);
    }
};

var ic = new IC();
