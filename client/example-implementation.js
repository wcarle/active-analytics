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
    console.log("lets go");
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


    $(".UNFMenu a").each(function () {
        $(this).before("<span title='Popularity' class='icon-size glyphicon glyphicon-triangle-right' href='" + $(this).attr("href") + "'></span>").parent("li").addClass("icon-menu");
    });
    $(".UNFMenu .icon-size")
        .ActiveAnalytics("rankstyle", $.extend({
            rank: {
                rangeStart: 8,
                rangeEnd: 25,
                rankBy: "hits",
                style: "font-size",
                unit: "px",
                distribution:"even"
            }
        }, settings));

    //Create popular links list
    $("#news, #aaPopular").attr("id", "aaPopular").html("<h2><span class='title'>Popular Links</span></h2>");
    $("#aaPopular").ActiveAnalytics("popular-global",$.extend({wrap: $("<h3>")}, settings));
}
function init(){
    if(window.location.hash == "#admin"){
        //Control panel
        createModal('<h2><span class="title">Active Analytics</span></h2>Simulate Date:<div style="clear:both"><input type="text" placeholder="Date" id="txtDate"><input type="button" value="Set" id="btnDate"><img class="aaLoading" style="visibility: hidden;margin-top: -15px;" src="/image/loading.gif"></div>');
        $("#txtDate").val(new Date().toLocaleDateString());
        updateData($("#txtDate").val(), false);

        //Re-initialize when date button is clicked
        $("#btnDate").click(function () {
            updateData($("#txtDate").val(), true);
        });
    }
    else{
        var service = new TaskService();
    }

}
function createModal (content) {
    var $container = $("#UNFinfo");
    if($container.length == 0){
        $container = $("body");
    }
    if($("#aaMessage").length == 0){
        $container.append("<div id='aaMessage'></div>");
    }
    var $modal = $("#aaMessage");
    console.log(content);
    $modal.html(content);
    return $modal;
}

function TaskService() {
    this.tasks = [
        {
            title: "Task #1 Library",
            complete: function(){
                return window.location.pathname.replace(/\//g, "") === "library";
            },
            start: "/",
            desc: "Navigate to the Library home page.",
            date: null
        },
        {
            title: "Task #2 Current Students",
            complete: function(){
                return window.location.pathname.replace(/\//g, "") === "current";
            },
            start: "/",
            desc: "Navigate to the Current Students page.",
            date: null
        }
    ];
    this.finish = function(){
        var html = "<h2><span class='title'>You're Done!</span></h2><p>Thanks for helping me out!</p>";
        createModal(html);
    }
    this._guid = function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
    this.updateTask = function(currentTask){
        var html = "<h2><span class='title'>" + currentTask.title + "</span></h2><p>" + currentTask.desc + "</p>";
        createModal(html);
    }
    this.clearData = function(){
        console.log("clearingdata");
        sessionStorage["aaTasksTracking"] = "";
    }
    this.saveData = function () {
        sessionStorage["aaTasksTracking"] = JSON.stringify(this._data);
    }
    this.getData = function(){
        var _data = sessionStorage["aaTasksTracking"];
        if(_data === undefined || _data === ""){
            this._data = null;
        }
        else{
            this._data = JSON.parse(_data);
        }
    }

    this.resume = function () {
        var currentTask = this.tasks[this._data.currentTask];
        var finished = false;
        if(currentTask.complete()){
            var nextTask = this.tasks[this._data.currentTask + 1];
            console.log("next");
            console.log(nextTask);
            if(nextTask == null){
                this.finish();
                finished = true;
            }
            else{
                $modal = createModal("<h2><span class='title'>Task Complete!</span></h2><p>Click the next button to start the next task.</p><br/><a class='btn btn-primary' href='" + nextTask.start + "'>Next</a></h2>");
            }
            this._data.currentTask = this._data.currentTask + 1;
        }
        else{
            this.updateTask(currentTask);
            if(currentTask.date === null){
                updateData(new Date().toLocaleDateString(), false);
            }
            else{
                updateData(currentTask.date, true);
            }
        }
        if(this._data.actions === undefined){
            this._data.actions = [];
        }
        this._data.actions.push({ task: currentTask.title, url: window.location.pathname + window.location.search, timestamp: new Date().toISOString()});
        if(finished){
            //TODO save
            console.log("Pushing Data:");
            console.log(this._data);
            this.clearData();
            setTimeout(function () {
                window.location = "/";
            }, 5000);
        }
        else{
            this.saveData();
        }
    }
    this.initialize = function () {
        this._data = {};
        this._data.id = this._guid();
        this._data.currentTask = 0;
        this._data.actions = [];
        var self = this;
        var html = "<h2><span class='title'>Active Analytics Testing</span></h2><p>Thank you for taking the time to test my framework. I will ask you to complete a few small tasks and measure your time to complete those tasks.</p><p>When you are ready please click begin</p><br/><button type='button' id='btnBegin' class='btn btn-primary'>Begin</button>";;
        $modal = createModal(html);
        $modal.find("#btnBegin").click(function(){
            self.resume();
        });
        this.saveData();
    }

    this._data = null;
    this.getData();
    console.log(this._data);
    if(this._data == null){
        this.initialize();
    }
    else{
        this.resume();
    }
}