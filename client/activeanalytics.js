(function ( $ ) {
    // Pending requests hash
    var _pendingRequest = {};
    var _ajaxCalls = 0;

    function Service(options){
        var _svc = this

        //Public Properties
        _svc.settings = options;

        //Private Properties

        //Local storage cache for ajax requests
        var cachePrefix = "aa:cache:";

        //Private Methods
        function cacheGet(key){
            var val = localStorage[cachePrefix + key];
            if(val !== undefined){
                var cacheObj = JSON.parse(val);
                if(cacheObj.timestamp + options.cacheTime > new Date().getTime()){
                    return cacheObj.value;
                }
                else{
                    localStorage[cachePrefix + key] = undefined;
                }
            }
            return null;
        }
        function cacheSet(key, value){
            localStorage[cachePrefix + key] = JSON.stringify({ timestamp: new Date().getTime(), value: value });
        }
        function query(endpoint, params, callback){
            params.site = options.site;
            var cacheKey = endpoint + ":" + JSON.stringify(params);
            var cacheVal = cacheGet(cacheKey);
            if(_pendingRequest[cacheKey]){
                _pendingRequest[cacheKey].push({callback: callback, context: _svc});
            }
            else if(cacheVal === null || options.disableCache){
                params.date = options.date.toISOString();
                _pendingRequest[cacheKey] = [];
                _ajaxCalls++;
                $(options.loadingSelector).css("visibility", "visible");
                $.ajax({
                    dataType: "jsonp",
                    url: options.serviceURL + "/" + endpoint,
                    data: params,
                    cache: true,
                    success: function(data, xhr){
                        _ajaxCalls--;
                        if(_ajaxCalls == 0){
                            $(options.loadingSelector).css("visibility", "hidden");
                        }
                        cacheSet(cacheKey, data);
                        callback(data);
                        $.each(_pendingRequest[cacheKey], function(i, cb){
                            cb.callback.call(cb.context, data);
                        });
                        _pendingRequest[cacheKey] = null;
                    }
                })
            }
            else{
                callback(cacheVal);
            }
        }
        function prepareURL(url){
            url = url.replace(window.location.origin,"");
            if(url.slice(-1) == "/"){
                url += options.indexPage;
            }
            return url;
        }
        function filterLinks(elements){
            return elements.filter("[href^='/'], [href^='" + window.location.origin + "/']");
        }
        function findLinks(elements, url){
            return elements.filter("[href$='" + url + "'], [href$='" + url.replace(_svc.settings.indexPage, "") + "']");
        }
        function makeGradientColor(color1, color2, percent) {
            var newColor = {};

            function makeChannel(a, b) {
                return(a + Math.round((b-a)*(percent)));
            }
            function makeColor(strColor){
                strColor = strColor.replace("#", "");
                var r = parseInt(strColor.substring(0,2), 16);
                var g = parseInt(strColor.substring(2,4), 16);
                var b = parseInt(strColor.substring(4,6), 16);
                return {r: r, g: g, b: b};
            }
            function makeColorPiece(num) {
                num = Math.min(num, 255);   // not more than 255
                num = Math.max(num, 0);     // not less than 0
                var str = num.toString(16);
                if (str.length < 2) {
                    str = "0" + str;
                }
                return(str);
            }
            c1 = makeColor(color1);
            c2 = makeColor(color2);
            newColor.r = makeChannel(c1.r, c2.r);
            newColor.g = makeChannel(c1.g, c2.g);
            newColor.b = makeChannel(c1.b, c2.b);
            newColor.cssColor = "#" +
                                makeColorPiece(newColor.r) +
                                makeColorPiece(newColor.g) +
                                makeColorPiece(newColor.b);
            return newColor.cssColor;
        }

        //Public methods
        this.getSnapshot = function(url, callback){
            query("snapshot", {url: prepareURL(url)}, function(data){
                callback(data);
            });
        };
        this.getPopular = function(url, callback){
            query("popular", {url: prepareURL(url)}, function(data){
                callback(data);
            });
        };
        this.getRanking = function(urls, callback){
            urlquery = "";
            $.each(urls, function(i, url){
                urlquery += prepareURL(url) + (i == urls.length - 1 ? "": ",");
            });
            query("ranking", {urls: urlquery}, function(data){
                callback(data);
            });
        }
        this.popularLinks = function (element, global) {
            var callback = function (items) {
                $.each(items, function (i, item) {
                    if(i > options.maxLinks){
                        return;
                    }
                    $container = element;
                    if(options.wrap){
                        $container = options.wrap.clone();
                        element.append($container);
                    }
                    $link = $("<a href='" + item.url + "'>" + item.title.replace(_svc.settings.titleReplaceRegex, "") + "</a>");
                    $link.attr({'data-hits': item.hits, 'data-avg-time': item.avgTime, 'data-exit-rate': item.exitRate});
                    $container.append($link);
                })
            }
            if(global){
                this.getPopular(window.location.pathname, function (data) {
                    callback(data.popular);
                });
            }
            else{
                this.getSnapshot(window.location.pathname, function (data) {
                    callback(data.nextPages);
                });
            }
        }
        this.searchSuggestions = function(element){
            var buildAutocomplete = function(data){
                var suggestions = [];
                console.log(data.searches);
                $.each(data.searches, function(i, item){
                    suggestions.push({href: item.destURL.replace(_svc.settings.indexPage, ""), value: item.keyword})
                });
                console.log(suggestions);
                element.autocomplete("destroy");
                element.autocomplete({
                    minLength: 0,
                    source: suggestions,
                    focus: function(event, ui) {
                        if (ui.item !== null) {
                            element.val(ui.item.value);
                            return false;
                        }
                    },
                    select: function(event, ui) {
                        window.location = ui.item.href;
                        return false;
                    },
                    open: function(event, ui) {
                        $(".ui-autocomplete").find("li:gt(15)").hide;
                        $(".ui-autocomplete").prepend("<span style='font-weight:bold;'>Suggestions:</span>");
                        return false;
                    }
                });
                element.focus(function(){
                    $(this).autocomplete("search");
                });
            };
            this.getSnapshot(window.location.pathname, function(data){
                buildAutocomplete(data);
            });
        }
        this.hoverSuggestions = function(elements){
            var buildHoverSuggestions = function(){
                elements = filterLinks(elements);
                try{
                    elements.tooltipster('destroy');
                    elements.removeData();
                }
                catch(ex){
                    //Tooltips not initialized yet
                }
                elements.tooltipster({
                    content: "Loading...",
                    interactive: true,
                    contentAsHTML: true,
                    position: "bottom",
                    functionBefore: function(origin, continueTooltip){
                        continueTooltip();
                        if(origin.data("ajax") != "cached"){
                            var href = origin.attr("href");
                            _svc.getSnapshot(href, function(data){
                                var links = "";
                                var pages = data.nextPages;
                                var j = 0;
                                for(i = 0; j < 5 && i < pages.length; i++){
                                    if(!_svc.settings.ignoreHash[pages[i].url]){
                                        title = pages[i].title.replace(_svc.settings.titleReplaceRegex, "");
                                        links += "<li><a style='color:white' href='" + pages[i].url + "'>" + title + "</a></li>";
                                        j++;
                                    }
                                }
                                origin.tooltipster('content', $("<b>Popular:</b><ul>" + links + "</ul>")).data('ajax', 'cached')
                            });
                        }
                    }
                });
            }
            buildHoverSuggestions();
        }
        this.rankElements = function(elements, applyStyle){
            var _scaleFactors = {
                rangeS: _svc.settings.rank.rangeStart,
                rangeE: _svc.settings.rank.rangeEnd,
                min: 0,
                max: 1
            };
            var scaleRank = function (x){
                var rangeE = typeof _scaleFactors.rangeE === "string" ? 1 : _scaleFactors.rangeE;
                var rangeS = typeof _scaleFactors.rangeS === "string" ? 0 : _scaleFactors.rangeS;
                var min = _scaleFactors.min;
                var max = _scaleFactors.max;
                var val = (((rangeE - rangeS)*(x-min))/(max-min)) + rangeS;
                //Calculate color
                if(typeof _scaleFactors.rangeE == "string"){
                    return makeGradientColor(_scaleFactors.rangeS, _scaleFactors.rangeE, val);
                }
                else{
                    return val;
                }
            };
            var applyStyling = function(){
                elements.each(function(){
                    if($(this).attr("data-rank") !== undefined){
                        $(this).css(_svc.settings.rank.style, $(this).attr("data-rank") + (_svc.settings.rank.unit ? _svc.settings.rank.unit : ""));
                    }
                });
            };
            var calculateRanking = function(ranking){
                console.log(ranking);
                $.each(ranking, function(i, rank){
                    var rankValue = 0;
                    var rawRank = 0;
                    if(_svc.settings.rank.distribution == "even"){
                        rawRank = _scaleFactors.max - i + 1;
                        rankValue = scaleRank(rawRank);
                    }
                    else{
                        rankValue = scaleRank(rank.stats[_svc.settings.rank.rankBy]);
                        rawRank = rank.stats[_svc.settings.rank.rankBy];
                    }
                    var $els = findLinks(elements, rank.url).attr("data-rank", rankValue).attr("data-rank-raw", rawRank);
                });
            };
            elements = filterLinks(elements);
            if(elements.length > 0){
                var urls = [];
                elements.each(function(){
                    urls.push($(this).attr("href"));
                });
                console.log(urls);
                _svc.getRanking(urls, function(data){
                    var hits = data.map(function(page){ return page.stats.hits;});
                    if(_svc.settings.rank.distribution == "even"){
                        _scaleFactors.min = 0;
                        _scaleFactors.max = data.length;
                    }
                    else{
                        _scaleFactors.min = Math.min.apply(this, hits);
                        _scaleFactors.max = Math.max.apply(this, hits);
                    }
                    calculateRanking(data);
                    if(applyStyle){
                       applyStyling();
                    }
                });
            }

        }
    }

    //ActiveAnalytics jQuery Plugin
    $.fn.ActiveAnalytics = function(action, options) {
        var _settings = $.extend({
            indexPage: "default.aspx",
            serviceURL: "http://active-analytics.appspot.com",
            titleReplaceRegex: "",
            ignore: ["/default.aspx"],
            apiDate: new Date(),
            loadingSelector: ".aaLoading",
            wrap: null,
            maxLinks: 10,
            site: null,
            cacheTime: 3600000, //60 minutes
            rank: {
                rangeStart: 11,
                rangeEnd: 20,
                rankBy: "hits",
                style: "font-size",
                unit: "px",
                distribution: "even"
            }
        }, options);
        //Create a hash of the ignored pages for quick access
        _settings.ignoreHash = _settings.ignore.reduce(function(map, obj){
            map[obj] = true;
            return map;
        }, {});
        var _service = new Service(_settings);
        switch(action){
            case "search":
                _service.searchSuggestions(this);
                break;
            case "hover":
                _service.hoverSuggestions(this);
                break;
            case "rank":
                _service.rankElements(this, false);
                break;
            case "rankstyle":
                _service.rankElements(this, true);
                break;
            case "popular":
                _service.popularLinks(this, false);
                break;
            case "popular-global":
                _service.popularLinks(this, true);
                break;
        }

        return this;
    };
}( jQuery ));

//Example implementation
var host = "http://localhost:8082"
$(document).ready(function(){
    $("head").append("<link href='" + host + "/client/lib/activeanalytics.css' rel='stylesheet' />");
    $.getScript( host + "/client/lib/jquery.tooltipster.min.js", function( data, textStatus, jqxhr ) {setTimeout(init, 1000)});
});
function updateData (date, disableCache) {
    //Default settings
    var apiDate = new Date(Date.parse(date + " " + new Date().toLocaleTimeString()));
    var disableCache = disableCache === true ? true : false;
    var settings = {
        titleReplaceRegex: /(UNF - |University of North Florida - |UNF Mobile - - |- |UNF)/g,
        serviceURL: host,
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
    $container.append('<div style="position: fixed;top: 0px;left: 0px;max-width: 500px;background: white;border: 1px solid black;box-shadow: rgba(0, 0, 0, 0.5) 5px 5px 15px 0px;border-radius: 5px;margin-top: 10px;margin-left: 10px;padding: 10px;z-index: 999999;"><h2><span class="title">Active Analytics</span></h2>Simulate Date:<div style="clear:both"><input type="text" placeholder="Date" id="txtDate"><input type="button" value="Set" id="btnDate"><img class="aaLoading" style="visibility: hidden;margin-top: -15px;" src="/image/loading.gif"></div></div>');
    $("#txtDate").val(new Date().toLocaleDateString());
    $(document).ajaxComplete(function(){
        $(".aaLoading").css("visibility", "hidden");
    });
    $(document).ajaxStart(function(){
        $(".aaLoading").css("visibility", "visible");
    });
    updateData($("#txtDate").val(), false);
    $("#btnDate").click(function () {
        updateData($("#txtDate").val(), true);
    })
}