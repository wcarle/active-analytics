#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#	 http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
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
		shapshot = x.run_navigation_query("/default.aspx")
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