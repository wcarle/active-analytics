//Example implementation
function grabScripts (argument) {
    var host = "http://active-analytics.appspot.com";
    if(window.location.host.indexOf("localhost") >= 0){
        host = "http://localhost:8082";
    }
    window._AAHost = host;
    $("head").append("<link href='" + host + "/client/lib/activeanalytics.css' rel='stylesheet' />");
    $.getScript( host + "/client/lib/activeanalytics.js", function( data, textStatus, jqxhr ) {setTimeout(init, 1000);});
}
function updateData (date, disableCache, frameworkEnabled) {
    console.log("lets go");

    //Disable search feature
    $(document).submit(function() {
        alert("The search feature has been disabled for this test. Please navigate using the search suggestions or links on the page.");
        return false;
    });

    if (!frameworkEnabled) {
        return;
    }

    //Default settings
    var apiDate = new Date(Date.parse(date + " " + new Date().toLocaleTimeString()));
    disableCache = disableCache === true ? true : false;
    var settings = {
        titleReplaceRegex: /(University of North Florida|UNF - |University of North Florida - |UNF Mobile - - |- |UNF)/g,
        serviceURL: _AAHost,
        date: apiDate,
        disableCache: disableCache,
        site: "ga:991324"
    };

    //Populate search suggestions
    $("#box").ActiveAnalytics("search", settings);
    $("a").each(function(i){
        $(this).attr("data-page-id", "page-" + i);
    });

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

    //Library menu
    $("#mainMenu .collapse a")
        //Rank with color range
        .ActiveAnalytics("rankstyle", $.extend({
            rank: {
                rangeStart: "#dedede",
                rangeEnd: "#86C3FF",
                rankBy: "hits",
                style: "background-color"
            }
        }, settings))
        //Rank with font size
        .ActiveAnalytics("rankstyle", $.extend({
            rank: {
                rangeStart: 12,
                rangeEnd: 14,
                rankBy: "hits",
                style: "font-size",
                unit: "px"
            }
        }, settings)).css({"color":"black"});

    var $libCont = $("#ctl00_MainContentRegion_DZMain_uxColumnDisplay_ctl00_uxControlColumn_ctl00_uxWidgetHost_uxUpdatePanel");
    $libCont.html("<h3>Popular:</h3>");
    settings.callback = function() {
        $libCont.find("a").each(function(){
            $(this).text($(this).text().replace("Thomas G. Carpenter Library", ""));
        });
    };
    $libCont.ActiveAnalytics("popular",$.extend({wrap: $("<li style='font-weight: bold; padding-top:8px;'>")}, settings));
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
function createModal (content, full) {
    var $container = $("#UNFinfo");
    if($container.length === 0){
        $container = $("body");
    }
    if($("#aaMessage").length === 0){
        $container.append("<div id='aaMessage'></div>");
    }
    var $modal = $("#aaMessage");
    if (full) {
        $modal.addClass('full');
    }
    console.log(content);
    $modal.html(content);
    return $modal;
}

function TaskService() {
    this.tasks = [
        {
            id: 1,
            title: "Task #1 Library Hours",
            complete: function(){
                return window.location.pathname.replace(/\//g, "").toLowerCase() === "libraryhours";
            },
            start: "/",
            desc: "Please navigate to the Library “Hours of Operation” page (the page with a full calendar on it)",
            date: null
        },
        {
            id: 2,
            title: "Task #2 Printing and Copying",
            complete: function(){
                return window.location.pathname.replace(/\//g, "").toLowerCase() === "libraryservicesstudentsprinting.aspx";
            },
            start: "/",
            desc: "Navigate to the UNF library “Printing and Copying Information” page",
            date: null
        },
        {
            id: 3,
            title: "Task #3 HR Benefits",
            complete: function(){
                return window.location.pathname.replace(/\//g, "").toLowerCase() === "hrbenefitsbenefits.aspx";
            },
            start: "/",
            desc: "Navigate to the Human Resources “Benefits” page",
            date: null
        },
        {
            id: 4,
            title: "Task #4 HR Employment",
            complete: function(){
                return window.location.pathname.replace(/\//g, "").toLowerCase() === "hremploymentemployment.aspx";
            },
            start: "/",
            desc: "Navigate to the Human Resources “Employment” page",
            date: null
        },
        {
            id: 5,
            title: "Task #5 Admissions Deadlines",
            complete: function(){
                return window.location.pathname.replace(/\//g, "").toLowerCase() === "admissionsapplyadmission_deadlines_form.aspx";
            },
            start: "/",
            desc: "Navigate to the Undergraduate Admissions “Deadlines” page",
            date: null
        },
        {
            id: 6,
            title: "Task #6 Graduate Programs",
            complete: function(){
                return window.location.pathname.replace(/\//g, "").toLowerCase() === "graduateschoolacademicsgraduate_programs.aspx";
            },
            start: "/",
            desc: "Navigate to the Graduate School’s “Graduate Programs” page",
            date: null
        },
        {
            id: 7,
            title: "Task #7 Tuition",
            complete: function(){
                return window.location.pathname.replace(/\//g, "").toLowerCase() === "tuition";
            },
            start: "/",
            desc: "Navigate to the Controller’s office “Tuition and Fees” page",
            date: null
        }
    ];
    this.questions = [
        {
            id: 1,
            question: "Please select your age",
            answers: ["18-25","26-35","36-45","46-55","56-65","65+"]
        },
        {
            id: 2,
            question: "How experienced are you in using the internet?",
            answers: ["Very Experienced","Some Experience","Limited Experience","No Experience"]
        },
        {
            id: 3,
            question: "Which browser did you use to view the site?",
            answers: ["Internet Explorer","Google Chrome","Safari","Firefox"]
        },
        {
            id: 4,
            question: "Is English your primary language?",
            answers: ["Yes","No"]
        },
        {
            id: 5,
            question: "Have you visited the UNF website before?",
            answers: ["Yes","No"]
        },
        {
            id: 6,
            question: "If yes how often do you visit the UNF website?",
            answers: ["A few times a year","A few times per month","Once a week","Multiple times a week", "Daily", "Multiple times a day"]
        },
        {
            id: 7,
            question: "Were you able to complete all the tasks?",
            answers: ["Yes","No"]
        },
        {
            id: 8,
            question: "If not, why were you not able to complete the tasks?",
            answers: "text"
        },
        {
            id: 9,
            question: "Did you get lost at any point while trying to complete a task?",
            answers: ["Yes","No"]
        },
        {
            id: 10,
            question: "If yes please describe what happened",
            answers: "text"
        },
        {
            id: 11,
            question: "Were you frustrated at any point when trying to complete a task?",
            answers: ["Yes","No"]
        },
        {
            id: 12,
            question: "If yes please describe what caused the frustration",
            answers: "text"
        },
        {
            id: 13,
            question: "The link I was looking for on the page was easy to find",
            answers: "rate"
        },
        {
            id: 14,
            question: "The link I was looking for was close to the top of the page",
            answers: "rate"
        },
        {
            id: 15,
            question: "The site was easy to use",
            answers: "rate"
        },
        {
            id: 16,
            question: "It was easy to navigate to the requested destination",
            answers: "rate"
        },
        {
            id: 17,
            question: "Important links were presented prominently",
            answers: "rate"
        },
        {
            id: 18,
            question: "The site was too cluttered",
            answers: "rate"
        },
        {
            id: 19,
            question: "Exploring the site was frustrating",
            answers: "rate"
        },
        {
            id: 20,
            question: "It took too many clicks to find what I was looking for",
            answers: "rate"
        }
    ];
    this.finish = function(){
        var html = "<h2><span class='title'>You're Done!</span></h2><p>Thanks for helping me out!</p>";
        createModal(html);
    };
    this._guid = function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };
    this.submitData = function(){
         $.ajax({
            url: window._AAHost + '/submit',
            method: 'POST',
            data: {
                stat: JSON.stringify(this._data)
            }
         });
    };
    this.updateTask = function(currentTask){
        var html = "<h2><span class='title'>" + currentTask.title + "</span></h2><p>" + currentTask.desc + "</p><br/><button type='button' id='btnSkip' class='btn btn-primary'>Skip</button>";
        return createModal(html);
    };
    this.clearData = function(){
        console.log("clearingdata");
        sessionStorage["aaTasksTracking"] = "";
    };
    this.saveData = function () {
        sessionStorage["aaTasksTracking"] = JSON.stringify(this._data);
    };
    this.getData = function(){
        var _data = sessionStorage["aaTasksTracking"];
        if(_data === undefined || _data === ""){
            this._data = null;
        }
        else{
            this._data = JSON.parse(_data);
        }
        return this._data;
    };
    this.survey = function(){
        var service = this;
        $content = $("<div>");
        $content.append("<h2><span class='title'>Final Survey</span></h2><p>Thank you for completing the tasks, please fill out this short survey about your experience.</p>");
        $.each(this.questions, function (i, question) {
            $q = $("<div data-question-id='" + question.id + "' class='form-group'>");
            $q.append("<label class='question' for='q" + question.id + "'>" + question.question + "</label>");
            $a = $("<div class='answer'>");
            $q.append($a);
            if (question.answers === "text") {
                $q.data("type", "text");
                $a.append("<textarea class='form-control' name='q" + question.id + "' type='text'></textarea>");
            }
            else if (question.answers === "rate") {
                $q.data("type", "rate");
                for (n = 1; n <= 5; n++) {
                    $a.append("<label><input name='q" + question.id + "' type='radio'></input>" + n + "</label>");
                }
                $a.prepend("Disagree ");
                $a.append(" Agree");
            }
            else {
                $q.data("type", "mult");
                $.each(question.answers, function (j, answer) {
                    $a.append("<label><input name='q" + question.id + "' type='radio'></input>" + answer + "</label>");
                });
            }
            $content.append($q);
            $content.append("<hr/>");
        });
        $content.append("<button class='btn btn-primary submit-btn'>Submit</button>");
        $content.find(".submit-btn").click(function(){
            var data = service.getData();
            $content.find(".form-group").each(function(){
                var answer = {};
                if ($(this).find("textarea").length > 0) {
                    answer.answer = $(this).find("textarea").val();
                }
                else {
                    answer.answer = $(this).find("input:checked").parent().text();
                }
                answer.questionId = parseInt($(this).data("question-id"));
                answer.question = $(this).find(".question").text();
                data.answers.push(answer);
            });
            service.complete();
        });
        createModal($content, true);
    };
    this.complete = function(){
        console.log("Pushing Data:");
        this.submitData();
        console.log(this._data);
        this.clearData();
        this.finish();
        setTimeout(function () {
            window.location = "/";
        }, 10000);
    };
    this.resume = function () {
        var currentTask = this.tasks[this._data.currentTask];
        var finished = false;
        var frameworkEnabled = this._data.frameworkEnabled;
        var svc = this;
        if(currentTask.complete()){
            var nextTask = this.tasks[this._data.currentTask + 1];
            console.log("next");
            console.log(nextTask);
            if(!nextTask){
                this.finish();
                finished = true;
            }
            else{
                $modal = createModal("<h2><span class='title'>Task Complete!</span></h2><p>Click the next button to start the next task.</p><br/><a class='btn btn-primary' href='" + nextTask.start + "'>Next</a></h2>");
            }
            this._data.currentTask = this._data.currentTask + 1;
        }
        else{
            var $modal = this.updateTask(currentTask);
            var $skip = $modal.find("#btnSkip");
            if ($skip.length > 0) {
                $skip.click(function(){
                    var clickData = { task: currentTask.title, taskId: currentTask.id, url: window.location.pathname + window.location.search, href: "#skip", aaid: "none", timestamp: new Date().toISOString() };
                    var d = svc.getData();
                    d.clicks.push(clickData);
                    var nextTask = svc.tasks[svc._data.currentTask + 1];
                    svc._data.currentTask = svc._data.currentTask + 1;
                    svc.saveData();
                    if(!nextTask){
                        svc.finish();
                        svc.survey();
                    }
                    else{
                        window.location = "/";
                    }
                });
            }
            if(currentTask.date === null){
                updateData(new Date().toLocaleDateString(), false, frameworkEnabled);
            }
            else{
                updateData(currentTask.date, true, frameworkEnabled);
            }
        }
        if(this._data.actions === undefined){
            this._data.actions = [];
        }
        this._data.actions.push({ task: currentTask.title, taskId: currentTask.id, url: window.location.pathname + window.location.search, timestamp: new Date().toISOString()});
        if(finished){
            this.survey();
        }
        else{
            this.saveData();
        }
        $(document).click(function(e){
            try {
                var d = svc.getData();
                if(d.clicks === undefined) {
                    d.clicks = [];
                }
                aaId = $(e.toElement).attr("data-aa-id");
                href = $(e.toElement).attr("href");
                if(!href) {
                    return;
                }
                var clickData = { task: currentTask.title, taskId: currentTask.id, url: window.location.pathname + window.location.search, href: href, aaid: "none", timestamp: new Date().toISOString() };
                if(aaId) {
                    clickData.aaid = aaId;
                }
                d.clicks.push(clickData);
                svc.saveData();
            }
            catch(e) {
                console.log("error tracking click");
            }
        });
    };
    this.initialize = function () {
        this._data = {};
        this._data.id = this._guid();
        this._data.frameworkEnabled = Math.floor((Math.random() * 2)) === 1;
        this._data.frameworkEnabled = true; //Comment out to enable random starting state
        this._data.currentTask = 0;
        this._data.actions = [];
        this._data.answers = [];
        this._data.clicks  = [];
        this._data.userAgent = navigator.userAgent;
        var self = this;
        var html = "<h2><span class='title'>Active Analytics Testing</span></h2><p>Thank you for participating in our study, we will ask you to complete some simple navigation tasks. We will display the name of a page and we ask that you navigate to this page using links on the page.  It may take several clicks before you reach the destination page.</p><br/><button type='button' id='btnBegin' class='btn btn-primary'>Begin</button>";
        $modal = createModal(html);
        $modal.find("#btnBegin").click(function(){
            self.resume();
        });
        this.saveData();
    };

    this._data = null;
    this.getData();
    console.log(this._data);
    if(this._data === null){
        this.initialize();
    }
    else{
        this.resume();
    }
}