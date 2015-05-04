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

import jinja2
import webapp2

# [END imports]

class SnapshotHandler(webapp2.RequestHandler):
  def get(self):
    url = self.request.GET["url"]

    x = ExtractionService("ga:991324")
    snap = x.get_page_snapshot(url)

    json_snapshot = json.dumps(snap.to_dict(), cls=DateEncoder)

    self.response.write(json_response(json_snapshot, self.request.GET["callback"]))

class RankingHandler(webapp2.RequestHandler):
  def get(self):
    urls = self.request.GET["urls"]
    x = ExtractionService("ga:991324")
    snapshots = []
    urlarr = urls.split(",")
    rankings = x.get_global_ranking(urlarr)
    srankings = []
    for ranking in rankings:
      srankings.append(json.dumps(ranking.to_dict(), cls=DateEncoder))
    json_rankings = "[" + string.join(srankings,", ") + "]"
    self.response.write(json_response(json_rankings, self.request.GET["callback"]))

def json_response(json, callback):
  if callback is not None:
    return callback + "(" + json + ")"
  else:
    return json

#JSON Date encoder 
class DateEncoder(JSONEncoder):
  def default(self, obj):
    if isinstance(obj, datetime):
      return obj.isoformat()
    return JSONEncoder.default(self, obj)