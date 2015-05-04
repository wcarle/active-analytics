//Example implementation
var host = "http://localhost:8082"
$(document).ready(function(){
    $("head").append("<link href='" + host + "/client/lib/tooltipster.css' rel='stylesheet' />")
    $.getScript( host + "/client/lib/jquery.tooltipster.min.js", function( data, textStatus, jqxhr ) {setTimeout(init, 1000)});
});

function init(){
    $("#box").ActiveAnalytics("search", {serviceURL: host});
    $("#simple a, .audience a").ActiveAnalytics("hover", {serviceURL: host});
    $("#UNFbignav li a")
        .ActiveAnalytics("rankstyle", {serviceURL: host, rank: {
            rangeStart: "#EEEFF0",
            rangeEnd: "#86C3FF",
            rankBy: "hits",
            style: "background-color",
            distribution:"even"
        }})
        .ActiveAnalytics("rankstyle", {serviceURL: host, rank: {
            rangeStart: 11,
            rangeEnd: 13,
            rankBy: "hits",
            style: "font-size",
            unit: "px"
        }}).css({"color":"black"});
    $("#UNFbignav ul").css({"height": "auto"});
    $("#leftCol table li a").ActiveAnalytics("rankstyle", {serviceURL: host, rank: {
            rangeStart: "#FFFFFF",
            rangeEnd: "#FFFF24",
            rankBy: "hits",
            style: "background-color",
            distribution:"even"
        }});
}

