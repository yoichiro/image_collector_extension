var Utils = function() {
};

Utils.prototype = {
    getOptionValue: function(name, defaultValue) {
        var value = localStorage[name];
        if (value) {
            return value;
        } else {
            return defaultValue;
        }
    },
    setVisible: function(e, visible) {
        Element.setStyle(
            e,
            {display: visible ? "inline-block" : "none"});
    },
    setMessageResources: function(hash) {
        for (var key in hash) {
            $(key).innerHTML = chrome.i18n.getMessage(hash[key]);
        }
    }
};

var utils = new Utils();