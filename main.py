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
from src.services.extractionservice import ExtractionService
from src.entities.pagesnapshot import *
from src.controllers.default import MainHandler
from src.controllers.api import SnapshotHandler
from src.controllers.api import RankingHandler

import jinja2
import webapp2



app = webapp2.WSGIApplication([
  ('/', MainHandler),
  ('/snapshot*', SnapshotHandler),
  ('/ranking*', RankingHandler)
], debug=True)


#app.error_handlers[404] = handle_404
#app.error_handlers[500] = handle_500