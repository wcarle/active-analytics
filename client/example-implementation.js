//Example implementation
function grabScripts (argument) {
    var host = "http://active-analytics.appspot.com";
    if(window.location.host.indexOf("localhost") >= 0){
        host = "http://localhost:8082";
    }
    window._AAHost = host;
    $("head").append("<link href='" + host + "/client/lib/activeanalytics.css' rel='stylesheet' />");
    $.getScript( host + "/client/lib/activeanalytics.js", function( data, textStatus, jqxhr ) {setTimeout(init, 1000)});
}
function updateData (date, disableCache) {
    //Default settings
    var apiDate = new Date(Date.parse(date + " " + new Date().toLocaleTimeString()));
    var disableCache = disableCache === true ? true : false;
    var settings = {
        titleReplaceRegex: /(UNF - |University of North Florida - |UNF Mobile - - |- |UNF)/g,
        serviceURL: _AAHost,
        date: apiDate,
        disableCache: disableCache,
        site: "ga:991324"
    };

    //Populate search suggestions
    $("#box").ActiveAnalytics("search", settings);

    //Create hover suggestions
    $("#simple a, .audience a").ActiveAnalytics("hover", settings);

    //Rank links in homepage nav well
    $("#UNFbignav li a")
        //Rank with color range
        .ActiveAnalytics("rankstyle", $.extend({
            rank: {
                rangeStart: "#EEEFF0",
                rangeEnd: "#86C3FF",
                rankBy: "hits",
                style: "background-color",
                distribution:"even"
            }
        }, settings))
        //Rank with font size
        .ActiveAnalytics("rankstyle", $.extend({
            rank: {
                rangeStart: 11,
                rangeEnd: 13,
                rankBy: "hits",
                style: "font-size",
                unit: "px"
            }
        }, settings)).css({"color":"black"});
    $("#UNFbignav ul").css({"height": "auto"});

    //Rank links on audience page with color range
    $("#leftCol table li a")
        .ActiveAnalytics("rankstyle", $.extend({
            rank: {
                rangeStart: "#FFFFFF",
                rangeEnd: "#FFFF24",
                rankBy: "hits",
                style: "background-color",
                distribution:"even"
            }
        }, settings))
        .ActiveAnalytics("rankstyle", $.extend({
            rank: {
                rangeStart: 12,
                rangeEnd: 15,
                rankBy: "hits",
                style: "font-size",
                unit: "px"
            }
        }, settings))
        .ActiveAnalytics("rankstyle", $.extend({
            rank: {
                rangeStart: 15,
                rangeEnd: 30,
                rankBy: "hits",
                style: "line-height",
                unit: "px"
            }
        }, settings));

    //Create popular links list
    $("#news, #aaPopular").attr("id", "aaPopular").html("<h2><span class='title'>Popular Links</span></h2>");
    $("#aaPopular").ActiveAnalytics("popular-global",$.extend({wrap: $("<h3>")}, settings));
}
function init(){
    var $container = $("#UNFinfo");
    if($container.length == 0){
        $container = $("body");
    }

    //Control panel
    $container.append('<div style="position: fixed;top: 0px;left: 0px;max-width: 500px;background: white;border: 1px solid black;box-shadow: rgba(0, 0, 0, 0.5) 5px 5px 15px 0px;border-radius: 5px;margin-top: 10px;margin-left: 10px;padding: 10px;z-index: 999999;"><h2><span class="title">Active Analytics</span></h2>Simulate Date:<div style="clear:both"><input type="text" placeholder="Date" id="txtDate"><input type="button" value="Set" id="btnDate"><img class="aaLoading" style="visibility: hidden;margin-top: -15px;" src="/image/loading.gif"></div></div>');
    $("#txtDate").val(new Date().toLocaleDateString());
    updateData($("#txtDate").val(), false);

    //Re-initialize when date button is clicked
    $("#btnDate").click(function () {
        updateData($("#txtDate").val(), true);
    })
}
