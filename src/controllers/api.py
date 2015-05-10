#API Controller
import string
import json
import webapp2
from datetime import datetime, timedelta
from json import JSONEncoder
from services.extractionservice import ExtractionService
from entities.pagesnapshot import *
from controllers.base import *

# SnapshotHandler: Get analytics snapshot of specified page
class SnapshotHandler(BaseHandler):
  def get(self):
    url = self.request.get("url")
    snap = self.extraction_service.get_page_snapshot(url)
    json_snapshot = json.dumps(snap.to_dict(), cls=DateEncoder)
    self.response.write(self.json_response(json_snapshot))

# RankingHandler: Rank the given pages based on analytics data
class RankingHandler(BaseHandler):
  def get(self):
    snapshots = []
    urls = self.request.get("urls")
    urlarr = urls.split(",")
    rankings = self.extraction_service.get_global_ranking(urlarr)
    srankings = []
    for ranking in rankings:
      srankings.append(json.dumps(ranking.to_dict(), cls=DateEncoder))
    json_rankings = "[" + string.join(srankings,", ") + "]"
    self.response.write(self.json_response(json_rankings))

class PopularHandler(BaseHandler):
  def get(self):
    url = self.request.get("url")
    snap = self.extraction_service.get_popular_pages(url)
    json_snapshot = json.dumps(snap.to_dict(), cls=DateEncoder)
    self.response.write(self.json_response(json_snapshot))