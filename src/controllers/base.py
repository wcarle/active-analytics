#Base Controller
import string
import json
import webapp2
from dateutil import parser
from datetime import datetime, timedelta
from json import JSONEncoder
from services.extractionservice import ExtractionService
from entities.pagesnapshot import *

# SnapshotHandler: Get analytics snapshot of specified page
class BaseHandler(webapp2.RequestHandler):
  def __init__(self, request, response):
    # Set self.request, self.response and self.app.
    self.initialize(request, response)
    self.date = None
    self.siteId = self.request.get("site")
    self.callback = self.request.get("callback")
    dateParam = self.request.get("date")
    if self.siteId == "":
      self.siteId = "ga:991324"
    if dateParam != "":
      self.date = parser.parse(dateParam).replace(tzinfo=None)
    self.extraction_service = ExtractionService(self.siteId, self.date)

  # Convert json string to jsonp response
  def json_response(self, json):
    if self.callback is not None:
      return self.callback + "(" + json + ")"
    else:
      return json

#JSON Date Encoder: convert dates properly in JSON string
class DateEncoder(JSONEncoder):
  def default(self, obj):
    if isinstance(obj, datetime):
      return obj.isoformat()
    return JSONEncoder.default(self, obj)