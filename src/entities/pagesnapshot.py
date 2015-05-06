from google.appengine.ext import ndb
from src.entities.pagehits import PageHits
from src.entities.search import Search

class PageSnapshot(ndb.Model):
  """Models an individual PageSnapshot"""
  id = ndb.StringProperty(indexed=True)
  url = ndb.StringProperty(indexed=True)
  prevPages = ndb.StructuredProperty(PageHits, repeated=True)
  nextPages = ndb.StructuredProperty(PageHits, repeated=True)
  destPages = ndb.StructuredProperty(PageHits, repeated=True)
  searches = ndb.StructuredProperty(Search, repeated=True)
  date = ndb.DateTimeProperty()

