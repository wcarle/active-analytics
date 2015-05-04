from google.appengine.ext import ndb

class Search(ndb.Model):
  """Models an individual PageHit"""  
  url = ndb.StringProperty(indexed=True)
  keyword = ndb.StringProperty(indexed=False)
  destURL = ndb.StringProperty(indexed=False)
  hits = ndb.IntegerProperty(indexed=False)