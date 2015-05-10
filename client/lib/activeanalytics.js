/**
 * Active Analytics jQuery Plugin
 * Author: Will Carle
**/
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
            if(options.indexPage && url.slice(-1) == "/"){
                url += options.indexPage;
            }
            return url;
        }
        function fixURL (url) {
            if(options.indexPage && url.indexOf("/" + options.indexPage) > 0){
                url = url.replace("/" + options.indexPage,"/");
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
                var j = 0;
                $.each(items, function (i, item) {
                    var title = item.title.replace(_svc.settings.titleReplaceRegex, "");
                    if(j < options.maxLinks && item.url != window.location.pathname && title !== ""){
                        j++;
                        $container = element;
                        if(options.wrap){
                            $container = options.wrap.clone();
                            element.append($container);
                        }
                        $link = $("<a href='" + fixURL(item.url) + "'>" + title + "</a>");
                        $link.attr({'data-hits': item.hits, 'data-avg-time': item.avgTime, 'data-exit-rate': item.exitRate});
                        $container.append($link);
                    }
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
                    suggestions.push({href: fixURL(item.destURL), value: item.keyword})
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
                                        links += "<li><a style='color:white' href='" + fixURL(pages[i].url) + "'>" + title + "</a></li>";
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

/**Required Plugins**/

//Tooltipster
/* Tooltipster v3.3.0 */;(function(e,t,n){function s(t,n){this.bodyOverflowX;this.callbacks={hide:[],show:[]};this.checkInterval=null;this.Content;this.$el=e(t);this.$elProxy;this.elProxyPosition;this.enabled=true;this.options=e.extend({},i,n);this.mouseIsOverProxy=false;this.namespace="tooltipster-"+Math.round(Math.random()*1e5);this.Status="hidden";this.timerHide=null;this.timerShow=null;this.$tooltip;this.options.iconTheme=this.options.iconTheme.replace(".","");this.options.theme=this.options.theme.replace(".","");this._init()}function o(t,n){var r=true;e.each(t,function(e,i){if(typeof n[e]==="undefined"||t[e]!==n[e]){r=false;return false}});return r}function f(){return!a&&u}function l(){var e=n.body||n.documentElement,t=e.style,r="transition";if(typeof t[r]=="string"){return true}v=["Moz","Webkit","Khtml","O","ms"],r=r.charAt(0).toUpperCase()+r.substr(1);for(var i=0;i<v.length;i++){if(typeof t[v[i]+r]=="string"){return true}}return false}var r="tooltipster",i={animation:"fade",arrow:true,arrowColor:"",autoClose:true,content:null,contentAsHTML:false,contentCloning:true,debug:true,delay:200,minWidth:0,maxWidth:null,functionInit:function(e,t){},functionBefore:function(e,t){t()},functionReady:function(e,t){},functionAfter:function(e){},hideOnClick:false,icon:"(?)",iconCloning:true,iconDesktop:false,iconTouch:false,iconTheme:"tooltipster-icon",interactive:false,interactiveTolerance:350,multiple:false,offsetX:0,offsetY:0,onlyOne:false,position:"top",positionTracker:false,positionTrackerCallback:function(e){if(this.option("trigger")=="hover"&&this.option("autoClose")){this.hide()}},restoration:"current",speed:350,timer:0,theme:"tooltipster-default",touchDevices:true,trigger:"hover",updateAnimation:true};s.prototype={_init:function(){var t=this;if(n.querySelector){var r=null;if(t.$el.data("tooltipster-initialTitle")===undefined){r=t.$el.attr("title");if(r===undefined)r=null;t.$el.data("tooltipster-initialTitle",r)}if(t.options.content!==null){t._content_set(t.options.content)}else{t._content_set(r)}var i=t.options.functionInit.call(t.$el,t.$el,t.Content);if(typeof i!=="undefined")t._content_set(i);t.$el.removeAttr("title").addClass("tooltipstered");if(!u&&t.options.iconDesktop||u&&t.options.iconTouch){if(typeof t.options.icon==="string"){t.$elProxy=e('<span class="'+t.options.iconTheme+'"></span>');t.$elProxy.text(t.options.icon)}else{if(t.options.iconCloning)t.$elProxy=t.options.icon.clone(true);else t.$elProxy=t.options.icon}t.$elProxy.insertAfter(t.$el)}else{t.$elProxy=t.$el}if(t.options.trigger=="hover"){t.$elProxy.on("mouseenter."+t.namespace,function(){if(!f()||t.options.touchDevices){t.mouseIsOverProxy=true;t._show()}}).on("mouseleave."+t.namespace,function(){if(!f()||t.options.touchDevices){t.mouseIsOverProxy=false}});if(u&&t.options.touchDevices){t.$elProxy.on("touchstart."+t.namespace,function(){t._showNow()})}}else if(t.options.trigger=="click"){t.$elProxy.on("click."+t.namespace,function(){if(!f()||t.options.touchDevices){t._show()}})}}},_show:function(){var e=this;if(e.Status!="shown"&&e.Status!="appearing"){if(e.options.delay){e.timerShow=setTimeout(function(){if(e.options.trigger=="click"||e.options.trigger=="hover"&&e.mouseIsOverProxy){e._showNow()}},e.options.delay)}else e._showNow()}},_showNow:function(n){var r=this;r.options.functionBefore.call(r.$el,r.$el,function(){if(r.enabled&&r.Content!==null){if(n)r.callbacks.show.push(n);r.callbacks.hide=[];clearTimeout(r.timerShow);r.timerShow=null;clearTimeout(r.timerHide);r.timerHide=null;if(r.options.onlyOne){e(".tooltipstered").not(r.$el).each(function(t,n){var r=e(n),i=r.data("tooltipster-ns");e.each(i,function(e,t){var n=r.data(t),i=n.status(),s=n.option("autoClose");if(i!=="hidden"&&i!=="disappearing"&&s){n.hide()}})})}var i=function(){r.Status="shown";e.each(r.callbacks.show,function(e,t){t.call(r.$el)});r.callbacks.show=[]};if(r.Status!=="hidden"){var s=0;if(r.Status==="disappearing"){r.Status="appearing";if(l()){r.$tooltip.clearQueue().removeClass("tooltipster-dying").addClass("tooltipster-"+r.options.animation+"-show");if(r.options.speed>0)r.$tooltip.delay(r.options.speed);r.$tooltip.queue(i)}else{r.$tooltip.stop().fadeIn(i)}}else if(r.Status==="shown"){i()}}else{r.Status="appearing";var s=r.options.speed;r.bodyOverflowX=e("body").css("overflow-x");e("body").css("overflow-x","hidden");var o="tooltipster-"+r.options.animation,a="-webkit-transition-duration: "+r.options.speed+"ms; -webkit-animation-duration: "+r.options.speed+"ms; -moz-transition-duration: "+r.options.speed+"ms; -moz-animation-duration: "+r.options.speed+"ms; -o-transition-duration: "+r.options.speed+"ms; -o-animation-duration: "+r.options.speed+"ms; -ms-transition-duration: "+r.options.speed+"ms; -ms-animation-duration: "+r.options.speed+"ms; transition-duration: "+r.options.speed+"ms; animation-duration: "+r.options.speed+"ms;",f=r.options.minWidth?"min-width:"+Math.round(r.options.minWidth)+"px;":"",c=r.options.maxWidth?"max-width:"+Math.round(r.options.maxWidth)+"px;":"",h=r.options.interactive?"pointer-events: auto;":"";r.$tooltip=e('<div class="tooltipster-base '+r.options.theme+'" style="'+f+" "+c+" "+h+" "+a+'"><div class="tooltipster-content"></div></div>');if(l())r.$tooltip.addClass(o);r._content_insert();r.$tooltip.appendTo("body");r.reposition();r.options.functionReady.call(r.$el,r.$el,r.$tooltip);if(l()){r.$tooltip.addClass(o+"-show");if(r.options.speed>0)r.$tooltip.delay(r.options.speed);r.$tooltip.queue(i)}else{r.$tooltip.css("display","none").fadeIn(r.options.speed,i)}r._interval_set();e(t).on("scroll."+r.namespace+" resize."+r.namespace,function(){r.reposition()});if(r.options.autoClose){e("body").off("."+r.namespace);if(r.options.trigger=="hover"){if(u){setTimeout(function(){e("body").on("touchstart."+r.namespace,function(){r.hide()})},0)}if(r.options.interactive){if(u){r.$tooltip.on("touchstart."+r.namespace,function(e){e.stopPropagation()})}var p=null;r.$elProxy.add(r.$tooltip).on("mouseleave."+r.namespace+"-autoClose",function(){clearTimeout(p);p=setTimeout(function(){r.hide()},r.options.interactiveTolerance)}).on("mouseenter."+r.namespace+"-autoClose",function(){clearTimeout(p)})}else{r.$elProxy.on("mouseleave."+r.namespace+"-autoClose",function(){r.hide()})}if(r.options.hideOnClick){r.$elProxy.on("click."+r.namespace+"-autoClose",function(){r.hide()})}}else if(r.options.trigger=="click"){setTimeout(function(){e("body").on("click."+r.namespace+" touchstart."+r.namespace,function(){r.hide()})},0);if(r.options.interactive){r.$tooltip.on("click."+r.namespace+" touchstart."+r.namespace,function(e){e.stopPropagation()})}}}}if(r.options.timer>0){r.timerHide=setTimeout(function(){r.timerHide=null;r.hide()},r.options.timer+s)}}})},_interval_set:function(){var t=this;t.checkInterval=setInterval(function(){if(e("body").find(t.$el).length===0||e("body").find(t.$elProxy).length===0||t.Status=="hidden"||e("body").find(t.$tooltip).length===0){if(t.Status=="shown"||t.Status=="appearing")t.hide();t._interval_cancel()}else{if(t.options.positionTracker){var n=t._repositionInfo(t.$elProxy),r=false;if(o(n.dimension,t.elProxyPosition.dimension)){if(t.$elProxy.css("position")==="fixed"){if(o(n.position,t.elProxyPosition.position))r=true}else{if(o(n.offset,t.elProxyPosition.offset))r=true}}if(!r){t.reposition();t.options.positionTrackerCallback.call(t,t.$el)}}}},200)},_interval_cancel:function(){clearInterval(this.checkInterval);this.checkInterval=null},_content_set:function(e){if(typeof e==="object"&&e!==null&&this.options.contentCloning){e=e.clone(true)}this.Content=e},_content_insert:function(){var e=this,t=this.$tooltip.find(".tooltipster-content");if(typeof e.Content==="string"&&!e.options.contentAsHTML){t.text(e.Content)}else{t.empty().append(e.Content)}},_update:function(e){var t=this;t._content_set(e);if(t.Content!==null){if(t.Status!=="hidden"){t._content_insert();t.reposition();if(t.options.updateAnimation){if(l()){t.$tooltip.css({width:"","-webkit-transition":"all "+t.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-moz-transition":"all "+t.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-o-transition":"all "+t.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-ms-transition":"all "+t.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms",transition:"all "+t.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms"}).addClass("tooltipster-content-changing");setTimeout(function(){if(t.Status!="hidden"){t.$tooltip.removeClass("tooltipster-content-changing");setTimeout(function(){if(t.Status!=="hidden"){t.$tooltip.css({"-webkit-transition":t.options.speed+"ms","-moz-transition":t.options.speed+"ms","-o-transition":t.options.speed+"ms","-ms-transition":t.options.speed+"ms",transition:t.options.speed+"ms"})}},t.options.speed)}},t.options.speed)}else{t.$tooltip.fadeTo(t.options.speed,.5,function(){if(t.Status!="hidden"){t.$tooltip.fadeTo(t.options.speed,1)}})}}}}else{t.hide()}},_repositionInfo:function(e){return{dimension:{height:e.outerHeight(false),width:e.outerWidth(false)},offset:e.offset(),position:{left:parseInt(e.css("left")),top:parseInt(e.css("top"))}}},hide:function(n){var r=this;if(n)r.callbacks.hide.push(n);r.callbacks.show=[];clearTimeout(r.timerShow);r.timerShow=null;clearTimeout(r.timerHide);r.timerHide=null;var i=function(){e.each(r.callbacks.hide,function(e,t){t.call(r.$el)});r.callbacks.hide=[]};if(r.Status=="shown"||r.Status=="appearing"){r.Status="disappearing";var s=function(){r.Status="hidden";if(typeof r.Content=="object"&&r.Content!==null){r.Content.detach()}r.$tooltip.remove();r.$tooltip=null;e(t).off("."+r.namespace);e("body").off("."+r.namespace).css("overflow-x",r.bodyOverflowX);e("body").off("."+r.namespace);r.$elProxy.off("."+r.namespace+"-autoClose");r.options.functionAfter.call(r.$el,r.$el);i()};if(l()){r.$tooltip.clearQueue().removeClass("tooltipster-"+r.options.animation+"-show").addClass("tooltipster-dying");if(r.options.speed>0)r.$tooltip.delay(r.options.speed);r.$tooltip.queue(s)}else{r.$tooltip.stop().fadeOut(r.options.speed,s)}}else if(r.Status=="hidden"){i()}return r},show:function(e){this._showNow(e);return this},update:function(e){return this.content(e)},content:function(e){if(typeof e==="undefined"){return this.Content}else{this._update(e);return this}},reposition:function(){var n=this;if(e("body").find(n.$tooltip).length!==0){n.$tooltip.css("width","");n.elProxyPosition=n._repositionInfo(n.$elProxy);var r=null,i=e(t).width(),s=n.elProxyPosition,o=n.$tooltip.outerWidth(false),u=n.$tooltip.innerWidth()+1,a=n.$tooltip.outerHeight(false);if(n.$elProxy.is("area")){var f=n.$elProxy.attr("shape"),l=n.$elProxy.parent().attr("name"),c=e('img[usemap="#'+l+'"]'),h=c.offset().left,p=c.offset().top,d=n.$elProxy.attr("coords")!==undefined?n.$elProxy.attr("coords").split(","):undefined;if(f=="circle"){var v=parseInt(d[0]),m=parseInt(d[1]),g=parseInt(d[2]);s.dimension.height=g*2;s.dimension.width=g*2;s.offset.top=p+m-g;s.offset.left=h+v-g}else if(f=="rect"){var v=parseInt(d[0]),m=parseInt(d[1]),y=parseInt(d[2]),b=parseInt(d[3]);s.dimension.height=b-m;s.dimension.width=y-v;s.offset.top=p+m;s.offset.left=h+v}else if(f=="poly"){var w=[],E=[],S=0,x=0,T=0,N=0,C="even";for(var k=0;k<d.length;k++){var L=parseInt(d[k]);if(C=="even"){if(L>T){T=L;if(k===0){S=T}}if(L<S){S=L}C="odd"}else{if(L>N){N=L;if(k==1){x=N}}if(L<x){x=L}C="even"}}s.dimension.height=N-x;s.dimension.width=T-S;s.offset.top=p+x;s.offset.left=h+S}else{s.dimension.height=c.outerHeight(false);s.dimension.width=c.outerWidth(false);s.offset.top=p;s.offset.left=h}}var A=0,O=0,M=0,_=parseInt(n.options.offsetY),D=parseInt(n.options.offsetX),P=n.options.position;function H(){var n=e(t).scrollLeft();if(A-n<0){r=A-n;A=n}if(A+o-n>i){r=A-(i+n-o);A=i+n-o}}function B(n,r){if(s.offset.top-e(t).scrollTop()-a-_-12<0&&r.indexOf("top")>-1){P=n}if(s.offset.top+s.dimension.height+a+12+_>e(t).scrollTop()+e(t).height()&&r.indexOf("bottom")>-1){P=n;M=s.offset.top-a-_-12}}if(P=="top"){var j=s.offset.left+o-(s.offset.left+s.dimension.width);A=s.offset.left+D-j/2;M=s.offset.top-a-_-12;H();B("bottom","top")}if(P=="top-left"){A=s.offset.left+D;M=s.offset.top-a-_-12;H();B("bottom-left","top-left")}if(P=="top-right"){A=s.offset.left+s.dimension.width+D-o;M=s.offset.top-a-_-12;H();B("bottom-right","top-right")}if(P=="bottom"){var j=s.offset.left+o-(s.offset.left+s.dimension.width);A=s.offset.left-j/2+D;M=s.offset.top+s.dimension.height+_+12;H();B("top","bottom")}if(P=="bottom-left"){A=s.offset.left+D;M=s.offset.top+s.dimension.height+_+12;H();B("top-left","bottom-left")}if(P=="bottom-right"){A=s.offset.left+s.dimension.width+D-o;M=s.offset.top+s.dimension.height+_+12;H();B("top-right","bottom-right")}if(P=="left"){A=s.offset.left-D-o-12;O=s.offset.left+D+s.dimension.width+12;var F=s.offset.top+a-(s.offset.top+s.dimension.height);M=s.offset.top-F/2-_;if(A<0&&O+o>i){var I=parseFloat(n.$tooltip.css("border-width"))*2,q=o+A-I;n.$tooltip.css("width",q+"px");a=n.$tooltip.outerHeight(false);A=s.offset.left-D-q-12-I;F=s.offset.top+a-(s.offset.top+s.dimension.height);M=s.offset.top-F/2-_}else if(A<0){A=s.offset.left+D+s.dimension.width+12;r="left"}}if(P=="right"){A=s.offset.left+D+s.dimension.width+12;O=s.offset.left-D-o-12;var F=s.offset.top+a-(s.offset.top+s.dimension.height);M=s.offset.top-F/2-_;if(A+o>i&&O<0){var I=parseFloat(n.$tooltip.css("border-width"))*2,q=i-A-I;n.$tooltip.css("width",q+"px");a=n.$tooltip.outerHeight(false);F=s.offset.top+a-(s.offset.top+s.dimension.height);M=s.offset.top-F/2-_}else if(A+o>i){A=s.offset.left-D-o-12;r="right"}}if(n.options.arrow){var R="tooltipster-arrow-"+P;if(n.options.arrowColor.length<1){var U=n.$tooltip.css("background-color")}else{var U=n.options.arrowColor}if(!r){r=""}else if(r=="left"){R="tooltipster-arrow-right";r=""}else if(r=="right"){R="tooltipster-arrow-left";r=""}else{r="left:"+Math.round(r)+"px;"}if(P=="top"||P=="top-left"||P=="top-right"){var z=parseFloat(n.$tooltip.css("border-bottom-width")),W=n.$tooltip.css("border-bottom-color")}else if(P=="bottom"||P=="bottom-left"||P=="bottom-right"){var z=parseFloat(n.$tooltip.css("border-top-width")),W=n.$tooltip.css("border-top-color")}else if(P=="left"){var z=parseFloat(n.$tooltip.css("border-right-width")),W=n.$tooltip.css("border-right-color")}else if(P=="right"){var z=parseFloat(n.$tooltip.css("border-left-width")),W=n.$tooltip.css("border-left-color")}else{var z=parseFloat(n.$tooltip.css("border-bottom-width")),W=n.$tooltip.css("border-bottom-color")}if(z>1){z++}var X="";if(z!==0){var V="",J="border-color: "+W+";";if(R.indexOf("bottom")!==-1){V="margin-top: -"+Math.round(z)+"px;"}else if(R.indexOf("top")!==-1){V="margin-bottom: -"+Math.round(z)+"px;"}else if(R.indexOf("left")!==-1){V="margin-right: -"+Math.round(z)+"px;"}else if(R.indexOf("right")!==-1){V="margin-left: -"+Math.round(z)+"px;"}X='<span class="tooltipster-arrow-border" style="'+V+" "+J+';"></span>'}n.$tooltip.find(".tooltipster-arrow").remove();var K='<div class="'+R+' tooltipster-arrow" style="'+r+'">'+X+'<span style="border-color:'+U+';"></span></div>';n.$tooltip.append(K)}n.$tooltip.css({top:Math.round(M)+"px",left:Math.round(A)+"px"})}return n},enable:function(){this.enabled=true;return this},disable:function(){this.hide();this.enabled=false;return this},destroy:function(){var t=this;t.hide();if(t.$el[0]!==t.$elProxy[0]){t.$elProxy.remove()}t.$el.removeData(t.namespace).off("."+t.namespace);var n=t.$el.data("tooltipster-ns");if(n.length===1){var r=null;if(t.options.restoration==="previous"){r=t.$el.data("tooltipster-initialTitle")}else if(t.options.restoration==="current"){r=typeof t.Content==="string"?t.Content:e("<div></div>").append(t.Content).html()}if(r){t.$el.attr("title",r)}t.$el.removeClass("tooltipstered").removeData("tooltipster-ns").removeData("tooltipster-initialTitle")}else{n=e.grep(n,function(e,n){return e!==t.namespace});t.$el.data("tooltipster-ns",n)}return t},elementIcon:function(){return this.$el[0]!==this.$elProxy[0]?this.$elProxy[0]:undefined},elementTooltip:function(){return this.$tooltip?this.$tooltip[0]:undefined},option:function(e,t){if(typeof t=="undefined")return this.options[e];else{this.options[e]=t;return this}},status:function(){return this.Status}};e.fn[r]=function(){var t=arguments;if(this.length===0){if(typeof t[0]==="string"){var n=true;switch(t[0]){case"setDefaults":e.extend(i,t[1]);break;default:n=false;break}if(n)return true;else return this}else{return this}}else{if(typeof t[0]==="string"){var r="#*$~&";this.each(function(){var n=e(this).data("tooltipster-ns"),i=n?e(this).data(n[0]):null;if(i){if(typeof i[t[0]]==="function"){var s=i[t[0]](t[1],t[2])}else{throw new Error('Unknown method .tooltipster("'+t[0]+'")')}if(s!==i){r=s;return false}}else{throw new Error("You called Tooltipster's \""+t[0]+'" method on an uninitialized element')}});return r!=="#*$~&"?r:this}else{var o=[],u=t[0]&&typeof t[0].multiple!=="undefined",a=u&&t[0].multiple||!u&&i.multiple,f=t[0]&&typeof t[0].debug!=="undefined",l=f&&t[0].debug||!f&&i.debug;this.each(function(){var n=false,r=e(this).data("tooltipster-ns"),i=null;if(!r){n=true}else if(a){n=true}else if(l){console.log('Tooltipster: one or more tooltips are already attached to this element: ignoring. Use the "multiple" option to attach more tooltips.')}if(n){i=new s(this,t[0]);if(!r)r=[];r.push(i.namespace);e(this).data("tooltipster-ns",r);e(this).data(i.namespace,i)}o.push(i)});if(a)return o;else return this}}};var u=!!("ontouchstart"in t);var a=false;e("body").one("mousemove",function(){a=true})})(jQuery,window,document);