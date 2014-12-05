# CoffeeScript
#Active Namespace Setup
namespace = (name) ->
    if not window.Active then window.Active = {}
    Active[name] = Active[name] or {}

namespace "Service"

class Active.Service
    constructor: (options = {}) ->  
        Active.__service__ = @   
        Active.__ignore__ = options.ignore ? ["/default.aspx"]
        @IndexPage = options.IndexPage ? "default.aspx"
        @ServiceURL = options.ServiceURL ? "http://active-analytics.appspot.com"   
        @getPageSnapshot = (url, callback) =>
            if url.slice(-1) == "/"
                url += @IndexPage
            @query("snapshot", {'url': url}, (data) -> 
                callback(new Active.ViewModels.Page(data))
            )
        @query = (endpoint, params, callback) =>
            $.ajax({
                dataType: "jsonp",
                url: @ServiceURL + "/" + endpoint,
                data: params,
                success: (data, xhr) =>
                    callback(data)
                })
    @getInstance = (options = {}) ->
        return Active.__service__ ? new Active.Service(options)

namespace "Tools"

class Active.Tools.HoverSuggestions
    @getSuggestions = (element) ->
        hattr = $(element).filter("[href^='/']")
        hattr.tooltipster({
            content: "Loading...",
            interactive: true,
            contentAsHTML: true,
            position: 'bottom',
            functionBefore: (origin, continueTooltip) ->
                continueTooltip()
                if origin.data('ajax') != 'cached'
                    href = origin.attr("href")
                    service = Active.Service.getInstance()              
                    service.getPageSnapshot(href, (page) ->
                        links = ""
                        npages = page.NextPages.filter (x) -> x.url not in Active.__ignore__
                        for suggestion in npages[0..5]
                            title = suggestion.title.replace /(UNF - |University of North Florida - )/g, ''
                            links += "<li><a style='color:white' href='" + suggestion.url + "'>" + title + "</a></li>"
                        origin.tooltipster('content', $("<ul>" + links + "</ul>")).data('ajax', 'cached')
                    )
            })
        
        
            

#Page Namespace
namespace "ViewModels"


###
ViewModels
###

#Active.ViewModels.Page
class Active.ViewModels.Page
    constructor: (data = {}, options = {}) ->     
        @URL = data.url
        @Date = data.date
        @DestPages = data.destPages
        @PrevPages = data.prevPages
        @NextPages = data.nextPages
                
  
#jQuery page load
$ ->
    
  