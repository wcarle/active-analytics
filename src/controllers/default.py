import os
import urllib
import string
from datetime import datetime, timedelta
from src.services.extractionservice import ExtractionService
from src.views.jinja import jinja_config
import webapp2

# [START main_page]
class MainHandler(webapp2.RequestHandler):
  def get(self):
    x = ExtractionService('ga:991324')
    snapshot = x.run_query(x.build_page_query(["/default.aspx", "/current/default.aspx"]))
    #snapshot = x.run_query(x.build_search_query("/current/default.aspx"))
    template_values = {   
      'snapshot': snapshot
    }
    template = jinja_config.JINJA_ENVIRONMENT.get_template('index.html')

    self.response.write(template.render(template_values))

class ErrorPage(webapp2.RequestHandler):
  def get(self):
    template = jinja_config.JINJA_ENVIRONMENT.get_template('error.html')
    self.response.write(template.render())  

def handle_404(request, response, exception):
  template = jinja_config.JINJA_ENVIRONMENT.get_template('error404.html')
  response.write(template.render())  
  response.set_status(404)

def handle_500(request, response, exception):
  template = jinja_config.JINJA_ENVIRONMENT.get_template('error500.html')
  response.write(template.render())  
  response.set_status(500)

#app.error_handlers[404] = handle_404
#app.error_handlers[500] = handle_500