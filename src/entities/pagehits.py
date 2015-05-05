from google.appengine.ext import ndb

class PageHits(ndb.Model):
  """Models an individual PageHit"""
  url = ndb.StringProperty(indexed=True)
  title = ndb.StringProperty(indexed=False)
  hits = ndb.IntegerProperty(indexed=False)
  avgTime = ndb.FloatProperty(indexed=False)
  exitRate = ndb.FloatProperty(indexed=False)