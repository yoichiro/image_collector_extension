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
    },
    assignMessages: function() {
        $("optCommand").innerHTML = chrome.i18n.getMessage("optCommand");
        $("optCommandTemplate").innerHTML = chrome.i18n.getMessage("optCommandTemplate");
        $("optCommandTemplateDescription").innerHTML = chrome.i18n.getMessage("optCommandTemplateDescription");
        $("command_template_save").innerHTML = chrome.i18n.getMessage("optCommandTemplateSave");
        $("optFilter").innerHTML = chrome.i18n.getMessage("optFilter");
        $("optFilterExts").innerHTML = chrome.i18n.getMessage("optFilterExts");
        $("optFilterExtsDescription").innerHTML = chrome.i18n.getMessage("optFilterExtsDescription");
        $("filter_exts_save").innerHTML = chrome.i18n.getMessage("optFilterExtsSave");
        $("optFilterExcepts").innerHTML = chrome.i18n.getMessage("optFilterExcepts");
        $("optFilterExceptsDescription").innerHTML = chrome.i18n.getMessage("optFilterExceptsDescription");
        $("filter_excepts_save").innerHTML = chrome.i18n.getMessage("optFilterExceptsSave");
        $("optFilterSize").innerHTML = chrome.i18n.getMessage("optFilterSize");
        $("optFilterSizeDescription").innerHTML = chrome.i18n.getMessage("optFilterSizeDescription");
        $("optFilterSizeWidth").innerHTML = chrome.i18n.getMessage("optFilterSizeWidth");
        $("optFilterSizeHeight").innerHTML = chrome.i18n.getMessage("optFilterSizeHeight");
        $("optFilterPriorityLinkHref").innerHTML = chrome.i18n.getMessage("optFilterPriorityLinkHref");
        $("optFilterPriorityLinkHrefDescription").innerHTML = chrome.i18n.getMessage("optFilterPriorityLinkHrefDescription");
        $("filter_size_save").innerHTML = chrome.i18n.getMessage("optFilterSizeSave");
        $("optDownload").innerHTML = chrome.i18n.getMessage("optDownload");
        $("optDownloadFilename").innerHTML = chrome.i18n.getMessage("optDownloadFilename");
        $("download_filename_save").innerHTML = chrome.i18n.getMessage("optDownloadFilenameSave");
        $("optDownloadFilenameDescription").innerHTML = chrome.i18n.getMessage("optDownloadFilenameDescription");
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
    }
};

var options = new Options();
