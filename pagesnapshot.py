from google.appengine.ext import ndb

class PageHits(ndb.Model):
	"""Models an individual PageHit"""	
	url = ndb.StringProperty(indexed=True)
	title = ndb.StringProperty(indexed=False)
	hits = ndb.IntegerProperty(indexed=False)
	avgTime = ndb.FloatProperty(indexed=False)
	exitRate = ndb.FloatProperty(indexed=False)
class PageSnapshot(ndb.Model):
	"""Models an individual PageSnapshot"""
	id = ndb.StringProperty(indexed=True)
	url = ndb.StringProperty(indexed=True)
	prevPages = ndb.StructuredProperty(PageHits, repeated=True)
	nextPages = ndb.StructuredProperty(PageHits, repeated=True)	
	destPages = ndb.StructuredProperty(PageHits, repeated=True)
	date = ndb.DateTimeProperty(auto_now_add=True)

