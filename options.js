var Options = function() {
    this.initialize();
};

Options.prototype = {
    initialize: function() {
        this.bg = chrome.extension.getBackgroundPage();
    },
    start: function() {
        this.assignMessages();
        this.assignEventHandlers();
        this.restoreConfigurations();
        this.checkDropboxAuthorized();
        this.checkGDriveAuthorized();
    },
    assignMessages: function() {
        var hash = {
            "optCommand": "optCommand",
            "optCommandTemplate": "optCommandTemplate",
            "optCommandTemplateDescription": "optCommandTemplateDescription",
            "command_template_save": "optCommandTemplateSave",
            "optFilter": "optFilter",
            "optFilterExts": "optFilterExts",
            "optFilterExtsDescription": "optFilterExtsDescription",
            "filter_exts_save": "optFilterExtsSave",
            "optFilterExcepts": "optFilterExcepts",
            "optFilterExceptsDescription": "optFilterExceptsDescription",
            "filter_excepts_save": "optFilterExceptsSave",
            "optFilterSize": "optFilterSize",
            "optFilterSizeDescription": "optFilterSizeDescription",
            "optFilterSizeWidth": "optFilterSizeWidth",
            "optFilterSizeHeight": "optFilterSizeHeight",
            "optFilterPriorityLinkHref": "optFilterPriorityLinkHref",
            "optFilterPriorityLinkHrefDescription": "optFilterPriorityLinkHrefDescription",
            "filter_size_save": "optFilterSizeSave",
            "optDownload": "optDownload",
            "optDownloadFilename": "optDownloadFilename",
            "download_filename_save": "optDownloadFilenameSave",
            "optDownloadFilenameDescription": "optDownloadFilenameDescription",
            "optServices": "optServices",
            "dropbox_authorized": "optDropboxAuthorized",
            "dropbox_unauthorized": "optDropboxUnauthorized",
            "auth_dropbox": "optAuthDropbox",
            "cancel_dropbox": "optCancelDropbox",
            "gdrive_authorized": "optGDriveAuthorized",
            "gdrive_unauthorized": "optGDriveUnauthorized",
            "auth_gdrive": "optAuthGDrive",
            "cancel_gdrive": "optCancelGDrive"
        };
        utils.setMessageResources(hash);
    },
    assignEventHandlers: function() {
        $("command_template_save").onclick =
            this.onClickCommandTemplateSave.bind(this);
        $("filter_exts_save").onclick =
            this.onClickFilterExtsSave.bind(this);
        $("filter_excepts_save").onclick =
            this.onClickFilterExceptsSave.bind(this);
        $("filter_size_save").onclick =
            this.onClickFilterSizeSave.bind(this);
        $("priority_link_href").onclick =
            this.onClickPriorityLinkHref.bind(this);
        $("download_filename_save").onclick =
            this.onClickDownloadFilenameSave.bind(this);
        $("auth_dropbox").onclick =
            this.onClickAuthDropbox.bind(this);
        $("cancel_dropbox").onclick =
            this.onClickCancelDropbox.bind(this);
        $("auth_gdrive").onclick =
            this.onClickAuthGDrive.bind(this);
        $("cancel_gdrive").onclick =
            this.onClickCancelGDrive.bind(this);
    },
    restoreConfigurations: function() {
        $("command_template").value = this.bg.ic.getCommandTemplate();
        $("filter_exts").value = this.bg.ic.getFilterExts();
        $("filter_excepts").value = this.bg.ic.getFilterExcepts();
        $("filter_size_width").value = this.bg.ic.getFilterSizeWidth();
        $("filter_size_height").value = this.bg.ic.getFilterSizeHeight();
        $("priority_link_href").checked = this.bg.ic.isPriorityLinkHref();
        $("download_filename").value = this.bg.ic.getDownloadFilename();
    },
    checkDropboxAuthorized: function() {
        this.bg.ic.checkDropboxAuthorized({
            onSuccess: function(req) {
                var result = req.responseJSON.result;
                utils.setVisible($("dropbox_authorized"), result);
                utils.setVisible($("dropbox_unauthorized"), !result);
                utils.setVisible($("auth_dropbox"), !result);
                utils.setVisible($("cancel_dropbox"), result);
            }.bind(this)
        });
    },
    checkGDriveAuthorized: function() {
        this.bg.ic.checkGDriveAuthorized({
            onSuccess: function(req) {
                var result = req.responseJSON.result;
                utils.setVisible($("gdrive_authorized"), result);
                utils.setVisible($("gdrive_unauthorized"), !result);
                utils.setVisible($("auth_gdrive"), !result);
                utils.setVisible($("cancel_gdrive"), result);
            }.bind(this)
        });
    },
    onClickCommandTemplateSave: function(evt) {
        localStorage["command_template"] = $("command_template").value;
        $("command_template_result").innerHTML =
            chrome.i18n.getMessage("optCommandTemplateSaveSucceed");
        setTimeout(function() {
            $("command_template_result").innerHTML = "";
        }, 5000);
    },
    onClickFilterExtsSave: function(evt) {
        var value = $("filter_exts").value.toLowerCase();
        localStorage["filter_exts"] = value;
        $("filter_exts_result").innerHTML =
            chrome.i18n.getMessage("optFilterExtsSaveSucceed");
        $("filter_exts").value = value;
        setTimeout(function() {
            $("filter_exts_result").innerHTML = "";
        }, 5000);
    },
    onClickFilterExceptsSave: function(evt) {
        var value = $("filter_excepts").value.toLowerCase();
        localStorage["filter_excepts"] = value;
        $("filter_excepts_result").innerHTML =
            chrome.i18n.getMessage("optFilterExceptsSaveSucceed");
        $("filter_excepts").value = value;
        setTimeout(function() {
            $("filter_excepts_result").innerHTML = "";
        }, 5000);
    },
    onClickFilterSizeSave: function(evt) {
        var width = $("filter_size_width").value;
        var height = $("filter_size_height").value;
        localStorage["filter_size_width"] = width;
        localStorage["filter_size_height"] = height;
        $("filter_size_result").innerHTML =
            chrome.i18n.getMessage("optFilterSizeSaveSucceed");
        setTimeout(function() {
            $("filter_size_result").innerHTML = "";
        }, 5000);
    },
    onClickPriorityLinkHref: function() {
        this.changeCheckboxConfiguration("priority_link_href");
    },
    onClickDownloadFilenameSave: function(evt) {
        localStorage["download_filename"] = $("download_filename").value;
        $("download_filename_result").innerHTML =
            chrome.i18n.getMessage("optDownloadFilenameSucceed");
        setTimeout(function() {
            $("download_filename_result").innerHTML = "";
        }, 5000);
    },
    changeCheckboxConfiguration: function(name) {
        localStorage[name] = $(name).checked ? "true" : "";
    },
    onClickAuthDropbox: function(evt) {
        location.href = this.bg.ic.getDropboxAuthUrl();
    },
    onClickCancelDropbox: function(evt) {
        this.bg.ic.cancelDropbox({
            onSuccess: function(req) {
                this.checkDropboxAuthorized();
            }.bind(this),
            onFailure: function(req) {
                this.checkDropboxAuthorized();
            }.bind(this)
        });
    },
    onClickCancelGDrive: function(evt) {
        this.bg.ic.cancelGDrive({
            onSuccess: function(req) {
                this.checkGDriveAuthorized();
            }.bind(this),
            onFailure: function(req) {
                this.checkGDriveAuthorized();
            }.bind(this)
        });
    },
    onClickAuthGDrive: function(evt) {
        var token = this.bg.ic.getSessionToken();
        var optionUrl = chrome.extension.getURL("options.html");
        var url =
            this.bg.ic.getServerUrl() + "auth_gdrive?"
            + "token=" + token
            + "&callback=" + encodeURIComponent(optionUrl);
        location.href = url;
    }
};

var options = new Options();
