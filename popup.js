/* From and to language */
if (localStorage["fromLang"] == "eu") {
    $("#eu2es").prop("checked", true);
} else {
    $("#es2eu").prop("checked", true);
}

$("#eu2es").click(function() {
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

