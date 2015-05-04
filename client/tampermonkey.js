$(document).ready(function(){
	var host = "http://localhost:8082"
    $("head").append("<link href='" + host + "/client/lib/tooltipster.css' rel='stylesheet' />")
    $.getScript( host + "/client/lib/jquery.tooltipster.min.js", function( data, textStatus, jqxhr ) {setTimeout(init, 1000)});
});

function init(){
	Active.Service.getInstance({ServiceURL: "http://localhost:8082" })
	Active.Tools.HoverSuggestions.getSuggestions($("#simple a, .audience a"))    
	Active.Tools.SearchSuggestions.getSuggestions(suggestions)
}
