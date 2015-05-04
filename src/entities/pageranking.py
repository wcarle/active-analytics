from google.appengine.ext import ndb
from src.entities.pagehits import PageHits

class PageRanking(ndb.Model):
  """Models an individual PageSnapshot"""
  id = ndb.StringProperty(indexed=True)
  url = ndb.StringProperty(indexed=True)
  stats = ndb.StructuredProperty(PageHits)
  date = ndb.DateTimeProperty(auto_now_add=True)