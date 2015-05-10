from google.appengine.ext import ndb
from src.entities.pagehits import PageHits

class GlobalTrend(ndb.Model):
  """Models an individual PageSnapshot"""
  id = ndb.StringProperty(indexed=True)
  popular = ndb.StructuredProperty(PageHits, repeated=True)
  date = ndb.DateTimeProperty(indexed=True)