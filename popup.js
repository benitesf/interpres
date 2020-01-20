/* From and to language */
if (localStorage["fromLang"] == "eu") {
    $("#eu2es").prop("checked", true);
} else {
    $("#es2eu").prop("checked", true);
}

if (localStorage["app"] == "on") {
    $("#power-cbx").prop("checked", true)
} else {
    $("#power-cbx").prop("checked", false)
}

$("#eu2es").click(function() {
    localStorage["last_word"] = "";
    if ($("#eu2es").prop("checked")) {
        localStorage["fromLang"] = "eu";
        localStorage["toLang"] = "es";
    }   
});

$("#es2eu").click(function() {
    if ($("#es2eu").prop("checked")) {
        localStorage["fromLang"] = "es";
        localStorage["toLang"] = "eu";
    }
});

$("#power-lbl").click(function() {
    if($("#power-cbx").prop("checked")) {
        localStorage["app"] = "off";
    } else {
        localStorage["app"] = "on";
    }
    chrome.extension.sendMessage({handler: 'switch_activated'});
});

