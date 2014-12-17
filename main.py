#Active Analytics
#
import os
import urllib
import string
import random
import json
from datetime import datetime, timedelta
from json import JSONEncoder
from google.appengine.api import users
from google.appengine.ext import ndb
from extractionservice import ExtractionService
from pagesnapshot import *

import jinja2
import webapp2

JINJA_ENVIRONMENT = jinja2.Environment(
	loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
	extensions=['jinja2.ext.autoescape'],
	autoescape=True)
# [END imports]

# [START main_page]
class MainHandler(webapp2.RequestHandler):
	def get(self):		

		x = ExtractionService('ga:991324')
		shapshot = x.run_query(x.build_navigation_query("/default.aspx", "previousPagePath", "pagePath"))
		template_values = {   
			'snapshot': shapshot
		}
		template = JINJA_ENVIRONMENT.get_template('index.html')

		self.response.write(template.render(template_values))


class SnapshotHandler(webapp2.RequestHandler):
	def get(self):
		url = self.request.GET["url"]

		x = ExtractionService('ga:991324')
		snap = x.get_page_snapshot(url)

		json_snapshot = json.dumps(snap.to_dict(), cls=DateEncoder)

		if "callback" in self.request.GET:
			json_snapshot = self.request.GET["callback"] + "(" + json_snapshot + ")"

		self.response.write(json_snapshot)

class ErrorPage(webapp2.RequestHandler):
	def get(self):
		template = JINJA_ENVIRONMENT.get_template('error.html')
		self.response.write(template.render())	

def handle_404(request, response, exception):
	template = JINJA_ENVIRONMENT.get_template('error404.html')
	response.write(template.render())	
	response.set_status(404)

def handle_500(request, response, exception):
	template = JINJA_ENVIRONMENT.get_template('error500.html')
	response.write(template.render())	
	response.set_status(500)

app = webapp2.WSGIApplication([
	('/', MainHandler),
	('/snapshot*', SnapshotHandler)
], debug=True)

#app.error_handlers[404] = handle_404
#app.error_handlers[500] = handle_500

#JSON Date encoder 
class DateEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return JSONEncoder.default(self, obj)